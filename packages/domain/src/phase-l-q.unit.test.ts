import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  canTransitionRecording,
  transitionRecording,
  isTerminalRecordingState,
  isActiveRecordingState,
} from './questions/speaking/recording-state-machine.js';
import {
  createUploadSession,
  acknowledgeChunk,
  isUploadComplete,
  detectMissingChunks,
  canFinaliseUpload,
  finaliseUpload,
} from './questions/speaking/upload-session.js';
import type { UploadSessionState } from './questions/speaking/upload-session.js';
import { countWords, isComplete, isEmpty, isIncomplete } from './questions/writing/word-count.js';
import { normaliseText } from './questions/writing/response-normalisation.js';
import { isLearningToolAvailable } from './questions/writing/writing-profile.js';
import { scoreObjective } from './scoring/engine.js';
import { rescore } from './scoring/rescore.js';
import type {
  ScoringProfile,
  ScoringInput,
  QuestionVersionId,
  MockSession,
  DiagnosticBlueprint,
  ScoringProfileId,
} from '@pte-app/contracts';
import {
  InMemoryProviderRegistry,
  validateEstimatedLabel,
  shouldRetry,
  nextRetryDelay,
  selectFallbackProvider,
} from './evaluation/index.js';
import { selectQuestions } from './diagnostics/question-selector.js';
import { detectWeaknesses, calculateTargetGap } from './diagnostics/weakness-detector.js';
import { generateReport } from './diagnostics/report-generator.js';
import { generateStudyPlan } from './study-plan/generator.js';
import { validatePlanContent } from './study-plan/content-resolver.js';
import { regeneratePlan } from './study-plan/regeneration.js';
import { canTransitionMock, isTerminalMockState } from './mock-exams/session-state-machine.js';
import { isDeadlineExpired, remainingTimeMs, remainingTimeClient } from './mock-exams/deadline.js';
import { canSubmit } from './mock-exams/auto-submit.js';
import { buildRecoveryState } from './mock-exams/recovery.js';
import { getNextTask } from './mock-exams/navigation.js';

function makeScoringProfile(overrides: Partial<ScoringProfile> = {}): ScoringProfile {
  return {
    id: 'sp_test' as ScoringProfileId,
    version: 1,
    rules: [
      {
        ruleType: 'multiple-answer-negative-marking',
        params: { correctCredit: 1, incorrectDeduction: 0.25, duplicatePolicy: 'reject' },
      },
    ],
    normalisation: { enabled: false, method: 'none' },
    noResponseBehaviour: { result: 0, reason: 'zero' },
    minimumResult: 0,
    maximumResult: 1,
    rounding: { method: 'none', decimalPlaces: 0 },
    ...overrides,
  };
}

function makeBinaryProfile(overrides: Partial<ScoringProfile> = {}): ScoringProfile {
  return makeScoringProfile({
    rules: [
      {
        ruleType: 'binary-correct-incorrect',
        params: { correctCredit: 1, incorrectDeduction: 0, duplicatePolicy: 'reject' },
      },
    ],
    ...overrides,
  });
}

function makeMockSession(overrides: Partial<MockSession> = {}): MockSession {
  const now = new Date().toISOString();
  return {
    id: 'ms_test',
    userId: 'user_1',
    blueprintId: 'bp_1',
    blueprintVersion: 1,
    serverDeadline: new Date(Date.now() + 3600000).toISOString(),
    currentSection: 'reading',
    currentTaskPosition: 0,
    selectedQuestions: [
      {
        questionId: 'q1',
        questionVersionId: 'qv1',
        taskType: 'reading_single_answer',
        section: 'reading',
        position: 0,
      },
      {
        questionId: 'q2',
        questionVersionId: 'qv2',
        taskType: 'reading_single_answer',
        section: 'reading',
        position: 1,
      },
    ],
    responses: [],
    playbackState: {},
    recordingState: {},
    progress: { completedTasks: 0, totalTasks: 2, currentSectionTasks: 0, totalSectionTasks: 2 },
    submissionState: { submitted: false },
    scoringWorkflow: { state: 'idle' },
    state: 'active',
    createdAt: now,
    ...overrides,
  };
}

describe('Phase L — Recording State Machine', () => {
  it('allows valid transitions', () => {
    assert.equal(canTransitionRecording('not-started', 'device-check'), true);
    assert.equal(canTransitionRecording('device-check', 'preparing'), true);
    assert.equal(canTransitionRecording('preparing', 'opening-microphone'), true);
    assert.equal(canTransitionRecording('opening-microphone', 'recording'), true);
    assert.equal(canTransitionRecording('recording', 'stopping'), true);
    assert.equal(canTransitionRecording('stopping', 'locally-preserved'), true);
    assert.equal(canTransitionRecording('locally-preserved', 'upload-queued'), true);
    assert.equal(canTransitionRecording('upload-queued', 'uploading'), true);
    assert.equal(canTransitionRecording('uploading', 'uploaded'), true);
    assert.equal(canTransitionRecording('uploaded', 'processing'), true);
    assert.equal(canTransitionRecording('processing', 'available'), true);
  });

  it('rejects invalid transitions', () => {
    assert.equal(canTransitionRecording('not-started', 'recording'), false);
    assert.equal(canTransitionRecording('available', 'recording'), false);
    assert.equal(canTransitionRecording('abandoned', 'recording'), false);
  });

  it('consumed attempt cannot reset', () => {
    assert.equal(isTerminalRecordingState('available'), true);
    assert.equal(isTerminalRecordingState('abandoned'), true);
    assert.equal(isTerminalRecordingState('recording'), false);
  });

  it('isActiveRecordingState identifies active states', () => {
    assert.equal(isActiveRecordingState('recording'), true);
    assert.equal(isActiveRecordingState('uploading'), true);
    assert.equal(isActiveRecordingState('processing'), true);
    assert.equal(isActiveRecordingState('available'), false);
  });

  it('throws on invalid transition', () => {
    assert.throws(() => transitionRecording('not-started', 'recording'), /Invalid recording transition/);
  });
});

describe('Phase L — Upload Session (durable state)', () => {
  it('creates upload session with injected ID', () => {
    const state = createUploadSession(
      { recordingId: 'rec_1', totalChunks: 5 },
      'us_injected_id',
      '2025-01-01T00:00:00Z',
    );
    assert.equal(state.session.id, 'us_injected_id');
    assert.equal(state.session.recordingId, 'rec_1');
    assert.equal(state.session.totalChunks, 5);
    assert.equal(state.acknowledgedSequenceNumbers.length, 0);
    assert.equal(state.session.state, 'active');
  });

  it('duplicate chunk is idempotent', () => {
    const state = createUploadSession({ recordingId: 'rec_1', totalChunks: 3 }, 'us_1', '2025-01-01T00:00:00Z');
    const updated = acknowledgeChunk(state, { sequenceNumber: 0, acknowledgedAt: '2025-01-01T00:00:01Z' });
    assert.equal(updated.acknowledgedSequenceNumbers.length, 1);
    const again = acknowledgeChunk(updated, { sequenceNumber: 0, acknowledgedAt: '2025-01-01T00:00:02Z' });
    assert.equal(again.acknowledgedSequenceNumbers.length, 1);
    assert.equal(updated, again);
  });

  it('rejects negative sequence number', () => {
    const state = createUploadSession({ recordingId: 'rec_1', totalChunks: 3 }, 'us_1', '2025-01-01T00:00:00Z');
    assert.throws(
      () => acknowledgeChunk(state, { sequenceNumber: -1, acknowledgedAt: '2025-01-01T00:00:01Z' }),
      /Invalid negative/,
    );
  });

  it('rejects sequence beyond total', () => {
    const state = createUploadSession({ recordingId: 'rec_1', totalChunks: 3 }, 'us_1', '2025-01-01T00:00:00Z');
    assert.throws(
      () => acknowledgeChunk(state, { sequenceNumber: 5, acknowledgedAt: '2025-01-01T00:00:01Z' }),
      /exceeds total chunks/,
    );
  });

  it('detects missing chunks', () => {
    let state = createUploadSession({ recordingId: 'rec_1', totalChunks: 4 }, 'us_1', '2025-01-01T00:00:00Z');
    state = acknowledgeChunk(state, { sequenceNumber: 0, acknowledgedAt: '2025-01-01T00:00:01Z' });
    state = acknowledgeChunk(state, { sequenceNumber: 2, acknowledgedAt: '2025-01-01T00:00:02Z' });
    const missing = detectMissingChunks(state);
    assert.deepEqual(missing, [1, 3]);
  });

  it('isUploadComplete when all acknowledged', () => {
    let state = createUploadSession({ recordingId: 'rec_1', totalChunks: 2 }, 'us_1', '2025-01-01T00:00:00Z');
    assert.equal(isUploadComplete(state), false);
    state = acknowledgeChunk(state, { sequenceNumber: 0, acknowledgedAt: '2025-01-01T00:00:01Z' });
    state = acknowledgeChunk(state, { sequenceNumber: 1, acknowledgedAt: '2025-01-01T00:00:02Z' });
    assert.equal(isUploadComplete(state), true);
  });

  it('canFinaliseUpload when complete', () => {
    let state = createUploadSession({ recordingId: 'rec_1', totalChunks: 2 }, 'us_1', '2025-01-01T00:00:00Z');
    assert.equal(canFinaliseUpload(state), false);
    state = acknowledgeChunk(state, { sequenceNumber: 0, acknowledgedAt: '2025-01-01T00:00:01Z' });
    state = acknowledgeChunk(state, { sequenceNumber: 1, acknowledgedAt: '2025-01-01T00:00:02Z' });
    assert.equal(canFinaliseUpload(state), true);
  });

  it('finaliseUpload rejects missing chunks', () => {
    let state = createUploadSession({ recordingId: 'rec_1', totalChunks: 3 }, 'us_1', '2025-01-01T00:00:00Z');
    state = acknowledgeChunk(state, { sequenceNumber: 0, acknowledgedAt: '2025-01-01T00:00:01Z' });
    assert.throws(() => finaliseUpload(state, '2025-01-01T00:00:02Z'), /missing chunks/);
  });

  it('finaliseUpload succeeds when complete', () => {
    let state = createUploadSession({ recordingId: 'rec_1', totalChunks: 2 }, 'us_1', '2025-01-01T00:00:00Z');
    state = acknowledgeChunk(state, { sequenceNumber: 0, acknowledgedAt: '2025-01-01T00:00:01Z' });
    state = acknowledgeChunk(state, { sequenceNumber: 1, acknowledgedAt: '2025-01-01T00:00:02Z' });
    const finalised = finaliseUpload(state, '2025-01-01T00:00:03Z');
    assert.equal(finalised.session.state, 'completed');
  });

  it('supplied ID is stable', () => {
    const state = createUploadSession({ recordingId: 'rec_1', totalChunks: 2 }, 'my_stable_id', '2025-01-01T00:00:00Z');
    assert.equal(state.session.id, 'my_stable_id');
  });

  it('survives reconstruction from persisted state', () => {
    let state = createUploadSession({ recordingId: 'rec_1', totalChunks: 3 }, 'us_1', '2025-01-01T00:00:00Z');
    state = acknowledgeChunk(state, { sequenceNumber: 0, acknowledgedAt: '2025-01-01T00:00:01Z' });
    state = acknowledgeChunk(state, { sequenceNumber: 2, acknowledgedAt: '2025-01-01T00:00:02Z' });

    const reconstructed: UploadSessionState = {
      session: { ...state.session },
      acknowledgedSequenceNumbers: [...state.acknowledgedSequenceNumbers],
    };

    assert.equal(reconstructed.acknowledgedSequenceNumbers.length, 2);
    assert.deepEqual(reconstructed.acknowledgedSequenceNumbers, [0, 2]);
    assert.equal(isUploadComplete(reconstructed), false);

    const again = acknowledgeChunk(reconstructed, { sequenceNumber: 0, acknowledgedAt: '2025-01-01T00:00:03Z' });
    assert.equal(again.acknowledgedSequenceNumbers.length, 2);
  });
});

describe('Phase M — Word Count', () => {
  it('counts words correctly', () => {
    assert.equal(countWords('Hello world'), 2);
    assert.equal(countWords('  Hello   world  '), 2);
    assert.equal(countWords(''), 0);
    assert.equal(countWords('   '), 0);
  });

  it('isComplete and isEmpty', () => {
    assert.equal(isComplete('Hello world', 1, 10), true);
    assert.equal(isComplete('Hi', 5, 10), false);
    assert.equal(isEmpty('', 0), true);
    assert.equal(isEmpty('Hello', 0), false);
    assert.equal(isIncomplete('Hi', 0, 5), true);
    assert.equal(isIncomplete('', 0, 5), false);
  });
});

describe('Phase M — Response Normalisation', () => {
  it('trims whitespace', () => {
    assert.equal(
      normaliseText('  hello  ', { trimWhitespace: true, normaliseUnicode: false, collapseMultipleSpaces: false }),
      'hello',
    );
  });

  it('collapses multiple spaces', () => {
    assert.equal(
      normaliseText('hello   world', { trimWhitespace: false, normaliseUnicode: false, collapseMultipleSpaces: true }),
      'hello world',
    );
  });
});

describe('Phase M — Writing Profile', () => {
  it('disables learning tools in mock mode', () => {
    const profile = {
      id: 'wp1' as ScoringProfileId,
      version: 1,
      minWordCoachingThreshold: 10,
      maxWordCoachingThreshold: 200,
      completionClassification: { emptyThreshold: 0, incompleteThreshold: 5 },
      normalisationPolicy: { trimWhitespace: true, normaliseUnicode: true, collapseMultipleSpaces: true },
      learningTools: { wordCount: true, spellCheck: true, grammarCheck: true, synonyms: true, templates: true },
      mockRestrictions: {
        disableSpellCheck: true,
        disableGrammarCheck: true,
        disableSynonyms: true,
        disableTemplates: true,
        disableCoaching: true,
      },
    };
    assert.equal(isLearningToolAvailable(profile, 'spellCheck', true), false);
    assert.equal(isLearningToolAvailable(profile, 'spellCheck', false), true);
  });
});

describe('Phase N — Profile-Driven Scoring Engine', () => {
  it('binary scoring from profile', () => {
    const profile = makeBinaryProfile();
    const input: ScoringInput = {
      questionVersionId: 'qv1' as QuestionVersionId,
      taskType: 'reading_single_answer',
      selectedAnswers: ['A'],
      correctAnswers: ['A'],
    };
    const result = scoreObjective(input, profile, 'att_1');
    assert.equal(result.rawResult, 1);
    assert.equal(result.noResponse, false);
    assert.equal(result.componentEvidence[0]?.ruleType, 'binary-correct-incorrect');
  });

  it('profile changes alter results deterministically', () => {
    const input: ScoringInput = {
      questionVersionId: 'qv1' as QuestionVersionId,
      taskType: 'reading_single_answer',
      selectedAnswers: ['A'],
      correctAnswers: ['A'],
    };
    const p1 = makeBinaryProfile({
      rules: [
        {
          ruleType: 'binary-correct-incorrect',
          params: { correctCredit: 2, incorrectDeduction: 0, duplicatePolicy: 'reject' },
        },
      ],
    });
    const p2 = makeBinaryProfile({
      rules: [
        {
          ruleType: 'binary-correct-incorrect',
          params: { correctCredit: 5, incorrectDeduction: 0, duplicatePolicy: 'reject' },
        },
      ],
    });
    assert.equal(scoreObjective(input, p1, 'a').rawResult, 2);
    assert.equal(scoreObjective(input, p2, 'a').rawResult, 5);
  });

  it('negative marking floor from profile', () => {
    const profile = makeScoringProfile({
      minimumResult: 0,
      rules: [
        {
          ruleType: 'multiple-answer-negative-marking',
          params: { correctCredit: 1, incorrectDeduction: 1, duplicatePolicy: 'reject' },
        },
      ],
    });
    const input: ScoringInput = {
      questionVersionId: 'qv1' as QuestionVersionId,
      taskType: 'reading_multiple_answers',
      selectedAnswers: ['Z'],
      correctAnswers: ['A'],
    };
    const result = scoreObjective(input, profile, 'att_1');
    assert.ok(result.boundedResult >= profile.minimumResult);
  });

  it('per-blank scoring', () => {
    const profile = makeScoringProfile({
      rules: [
        { ruleType: 'per-blank', params: { blankCredit: 1, casePolicy: 'insensitive', whitespacePolicy: 'collapse' } },
      ],
    });
    const input: ScoringInput = {
      questionVersionId: 'qv1' as QuestionVersionId,
      taskType: 'fill_in_blanks',
      selectedAnswers: ['hello', 'world'],
      correctAnswers: ['Hello', 'World'],
    };
    const result = scoreObjective(input, profile, 'att_1');
    assert.equal(result.rawResult, 2);
  });

  it('per-word scoring', () => {
    const profile = makeScoringProfile({
      rules: [
        { ruleType: 'per-word', params: { wordCredit: 0.5, casePolicy: 'insensitive', punctuationPolicy: 'strip' } },
      ],
    });
    const input: ScoringInput = {
      questionVersionId: 'qv1' as QuestionVersionId,
      taskType: 'write_from_dictation',
      selectedAnswers: ['Hello', 'World'],
      correctAnswers: ['hello', 'world'],
    };
    const result = scoreObjective(input, profile, 'att_1');
    assert.equal(result.rawResult, 1);
  });

  it('adjacent-pair scoring from profile', () => {
    const profile = makeScoringProfile({
      rules: [{ ruleType: 'adjacent-pair', params: { correctCredit: 1 } }],
    });
    const input: ScoringInput = {
      questionVersionId: 'qv1' as QuestionVersionId,
      taskType: 'reorder_paragraph',
      selectedAnswers: ['A', 'B', 'C'],
      correctAnswers: ['A', 'B', 'C'],
    };
    const result = scoreObjective(input, profile, 'att_1');
    assert.equal(result.rawResult, 2);
  });

  it('duplicate selections are rejected', () => {
    const profile = makeBinaryProfile();
    const input: ScoringInput = {
      questionVersionId: 'qv1' as QuestionVersionId,
      taskType: 'reading_single_answer',
      selectedAnswers: ['A', 'A'],
      correctAnswers: ['A'],
    };
    const result = scoreObjective(input, profile, 'att_1');
    assert.equal(result.rawResult, 1);
  });

  it('rejects unknown answer identifiers when validAnswerIdentifiers provided', () => {
    const profile = makeBinaryProfile();
    const input: ScoringInput = {
      questionVersionId: 'qv1' as QuestionVersionId,
      taskType: 'reading_single_answer',
      selectedAnswers: ['X'],
      correctAnswers: ['A'],
      context: { validAnswerIdentifiers: ['A', 'B', 'C'] },
    };
    assert.throws(() => scoreObjective(input, profile, 'att_1'), /Unknown answer identifier/);
  });

  it('no-response follows profile', () => {
    const profile = makeScoringProfile({
      noResponseBehaviour: { result: -0.5, reason: 'penalty' },
    });
    const input: ScoringInput = {
      questionVersionId: 'qv1' as QuestionVersionId,
      taskType: 'reading_multiple_answers',
      selectedAnswers: null,
      correctAnswers: ['A'],
    };
    const result = scoreObjective(input, profile, 'att_1');
    assert.equal(result.noResponse, true);
    assert.equal(result.boundedResult, -0.5);
  });

  it('rounding from profile', () => {
    const profile = makeScoringProfile({
      rules: [
        {
          ruleType: 'per-blank',
          params: { blankCredit: 0.333, casePolicy: 'insensitive', whitespacePolicy: 'collapse' },
        },
      ],
      rounding: { method: 'round', decimalPlaces: 2 },
      maximumResult: 10,
    });
    const input: ScoringInput = {
      questionVersionId: 'qv1' as QuestionVersionId,
      taskType: 'fill_in_blanks',
      selectedAnswers: ['a'],
      correctAnswers: ['a'],
    };
    const result = scoreObjective(input, profile, 'att_1');
    assert.equal(result.boundedResult, 0.33);
  });

  it('rejects unsupported rule type', () => {
    const profile = makeScoringProfile({
      rules: [{ ruleType: 'bogus-rule' as never, params: {} }],
    });
    const input: ScoringInput = {
      questionVersionId: 'qv1' as QuestionVersionId,
      taskType: 'reading_single_answer',
      selectedAnswers: ['A'],
      correctAnswers: ['A'],
    };
    assert.throws(() => scoreObjective(input, profile, 'att_1'), /Unsupported rule type/);
  });

  it('rejects empty rules', () => {
    const profile = makeScoringProfile({ rules: [] });
    const input: ScoringInput = {
      questionVersionId: 'qv1' as QuestionVersionId,
      taskType: 'reading_single_answer',
      selectedAnswers: ['A'],
      correctAnswers: ['A'],
    };
    assert.throws(() => scoreObjective(input, profile, 'att_1'), /at least one rule/);
  });

  it('rescore creates separate result', () => {
    const profile = makeBinaryProfile();
    const input: ScoringInput = {
      questionVersionId: 'qv1' as QuestionVersionId,
      taskType: 'reading_single_answer',
      selectedAnswers: ['A'],
      correctAnswers: ['A'],
    };
    const original = scoreObjective(input, profile, 'att_1');
    const rescored = rescore(original, 0.5, original.componentEvidence, 'Correction');
    assert.equal(rescored.resultType, 'rescore');
    assert.equal(rescored.supersedesResultId, original.resultId);
    assert.notEqual(rescored.resultId, original.resultId);
  });

  it('original result does not change after rescore', () => {
    const profile = makeBinaryProfile();
    const input: ScoringInput = {
      questionVersionId: 'qv1' as QuestionVersionId,
      taskType: 'reading_single_answer',
      selectedAnswers: ['A'],
      correctAnswers: ['A'],
    };
    const original = scoreObjective(input, profile, 'att_1');
    const snapshot = { ...original };
    rescore(original, 0.5, original.componentEvidence, 'test');
    assert.deepEqual(original, snapshot);
  });

  it('result includes engine and profile versions', () => {
    const profile = makeBinaryProfile({ version: 3 });
    const input: ScoringInput = {
      questionVersionId: 'qv1' as QuestionVersionId,
      taskType: 'reading_single_answer',
      selectedAnswers: ['A'],
      correctAnswers: ['A'],
    };
    const result = scoreObjective(input, profile, 'att_1');
    assert.equal(result.engineVersion, '1.0.0');
    assert.equal(result.scoringProfileVersion, 3);
  });

  it('golden fixture: multiple-answer scoring', () => {
    const profile = makeScoringProfile();
    const input: ScoringInput = {
      questionVersionId: 'qv1' as QuestionVersionId,
      taskType: 'reading_multiple_answers',
      selectedAnswers: ['A', 'B'],
      correctAnswers: ['A', 'C'],
    };
    const result = scoreObjective(input, profile, 'att_1');
    assert.equal(result.rawResult, 0.75);
  });
});

describe('Phase O — Evaluation', () => {
  it('provider registry rejects duplicates', () => {
    const registry = new InMemoryProviderRegistry();
    const provider = {
      providerType: 'speech-transcription',
      providerId: 'p1',
      version: '1.0',
      evaluate: async () => ({}),
    };
    registry.register(provider as never);
    assert.throws(() => registry.register(provider as never), /already registered/);
  });

  it('estimated-label enforcement', () => {
    const result = {
      resultId: 'r1',
      requestCorrelationId: 'c1',
      providerId: 'p1',
      providerVersion: '1.0',
      evaluationProfileVersion: 1,
      scoringProfileVersion: 1,
      resultClassification: 'estimated-training-result' as const,
      estimatedScore: 0.8,
      componentEvidence: [],
      confidence: { overallConfidence: 0.9 },
      warnings: [],
      limitations: [],
      createdAt: new Date().toISOString(),
    };
    assert.equal(validateEstimatedLabel(result), true);
  });

  it('retry policy', () => {
    const policy = { maxRetries: 3, backoffMs: 100, maxBackoffMs: 5000 };
    assert.equal(shouldRetry(policy, { attempt: 0, state: 'idle' }), true);
    assert.equal(shouldRetry(policy, { attempt: 3, state: 'retrying' }), false);
    assert.equal(nextRetryDelay(policy, 0), 100);
    assert.equal(nextRetryDelay(policy, 2), 400);
  });

  it('fallback provider selection', () => {
    const policy = { enabled: true, fallbackProviders: ['p2'], triggerOn: 'error' as const };
    const p1 = { providerType: 'speech-transcription', providerId: 'p1', version: '1.0', evaluate: async () => ({}) };
    const p2 = { providerType: 'speech-transcription', providerId: 'p2', version: '1.0', evaluate: async () => ({}) };
    const result = selectFallbackProvider(policy, 'p1', [p1, p2] as never[]);
    assert.equal(result?.providerId, 'p2');
  });
});

describe('Phase P — Diagnostics', () => {
  it('deterministic question selection', () => {
    const blueprint: DiagnosticBlueprint = {
      id: 'bp1',
      version: 1,
      includedSkills: [],
      taskDistribution: [{ taskType: 'reading_single_answer', section: 'reading', count: 2, difficultyRange: [1, 5] }],
      difficultyDistribution: { easy: 0.33, medium: 0.34, hard: 0.33 },
      selectionPolicy: { method: 'random', seed: 42 },
      minimumEvidence: 1,
      partialResultPolicy: { allowPartialResults: true, minimumCompletedTasks: 1, confidenceThreshold: 0.5 },
      scoringProfileReferences: [],
      estimatedResultMapping: [],
    };
    const questions = [
      { questionId: 'q1', questionVersionId: 'qv1', taskType: 'reading_single_answer', difficulty: 2 },
      { questionId: 'q2', questionVersionId: 'qv2', taskType: 'reading_single_answer', difficulty: 3 },
      { questionId: 'q3', questionVersionId: 'qv3', taskType: 'reading_single_answer', difficulty: 4 },
    ];
    const selected = selectQuestions(blueprint, questions);
    assert.equal(selected.length, 2);
    assert.ok(selected.every((s) => s.taskType === 'reading_single_answer'));
  });

  it('partial diagnostic', () => {
    const profile = {
      id: 'sp1',
      userId: 'u1',
      diagnosticSessionId: 'ds1',
      skills: [
        { skillId: 'reading', estimatedScore: 0.7, confidence: 0.8, evidenceCount: 3, isWeakness: false },
        { skillId: 'writing', estimatedScore: 0.3, confidence: 0.5, evidenceCount: 1, isWeakness: true },
      ],
      confidence: 0.6,
      missingEvidence: ['listening'],
      weaknessRationale: 'Writing has low confidence',
      createdAt: new Date().toISOString(),
    };
    const weaknesses = detectWeaknesses(profile);
    assert.equal(weaknesses.length, 1);
    assert.equal(weaknesses[0]!.skillId, 'writing');
  });

  it('target gap calculation', () => {
    assert.equal(calculateTargetGap(0.5, 0.8), 0.3);
    assert.equal(calculateTargetGap(0.8, 0.5), 0);
  });

  it('exam-date plan regeneration preserves history', () => {
    const report = {
      id: 'dr1',
      userId: 'u1',
      skillProfileId: 'sp1',
      weaknesses: [
        {
          skillId: 'writing',
          currentScore: 0.3,
          targetScore: 0.7,
          gap: 0.4,
          priority: 'high' as const,
          recommendedActivities: ['practice'],
        },
      ],
      targetGaps: [
        {
          skillId: 'writing',
          currentScore: 0.3,
          targetScore: 0.7,
          gap: 0.4,
          examDate: '2025-06-01',
          studyDaysAvailable: 30,
        },
      ],
      overallEstimatedScore: 0.5,
      recommendations: [],
      isPartial: false,
      generatedAt: new Date().toISOString(),
    };
    const plan = generateStudyPlan(report, {
      examDate: '2025-06-01',
      availableStudyDays: 5,
      sessionDurationMinutes: 30,
      availableContent: [{ contentId: 'c1', questionVersionId: 'qv1', taskType: 'writing', available: true }],
    });
    assert.equal(plan.version, 1);
    const { plan: newPlan, regeneration } = regeneratePlan(plan, 'exam-date-change', { examDate: '2025-07-01' });
    assert.equal(newPlan.version, 2);
    assert.equal(regeneration.previousVersion, 1);
    assert.equal(regeneration.reason, 'exam-date-change');
    assert.ok(regeneration.previousPlanSnapshot.length > 0);
  });
});

describe('Phase Q — Mock Exam Engine', () => {
  it('absolute deadline expiry', () => {
    const past = new Date(Date.now() - 1000).toISOString();
    assert.equal(isDeadlineExpired(past), true);
    const future = new Date(Date.now() + 3600000).toISOString();
    assert.equal(isDeadlineExpired(future), false);
  });

  it('reconnect state restoration with server clock', () => {
    const session = makeMockSession();
    const serverNow = new Date(Date.now() - 1000).toISOString();
    const clientReceived = new Date().toISOString();
    const recovery = buildRecoveryState(session, serverNow, clientReceived);
    assert.equal(recovery.canResume, true);
    assert.ok(recovery.remainingTimeMs > 0);
  });

  it('client cannot extend time via clock manipulation', () => {
    const session = makeMockSession({
      serverDeadline: new Date(Date.now() + 5000).toISOString(),
    });
    const serverNow = new Date().toISOString();
    const clientReceived = new Date().toISOString();

    const remaining = remainingTimeClient(session.serverDeadline, serverNow, clientReceived);
    assert.ok(remaining <= 6000);
    assert.ok(remaining >= 3000);
  });

  it('reconnect after deadline reports expired', () => {
    const session = makeMockSession({
      serverDeadline: new Date(Date.now() - 1000).toISOString(),
    });
    const serverNow = new Date(Date.now() - 2000).toISOString();
    const clientReceived = new Date(Date.now() - 1000).toISOString();
    const recovery = buildRecoveryState(session, serverNow, clientReceived);
    assert.equal(recovery.isExpired, true);
    assert.equal(recovery.canResume, false);
  });

  it('duplicate submit prevention', () => {
    const session = makeMockSession({ submissionState: { submitted: true, idempotencyKey: 'key1' } });
    const result = canSubmit(session, 'key2');
    assert.equal(result.allowed, false);
    assert.equal(result.reason, 'already-submitted');
  });

  it('idempotent duplicate submit', () => {
    const session = makeMockSession({ submissionState: { submitted: true, idempotencyKey: 'key1' } });
    const result = canSubmit(session, 'key1');
    assert.equal(result.allowed, true);
    assert.equal(result.reason, 'idempotent-duplicate');
  });

  it('selected question-version preservation', () => {
    const session = makeMockSession();
    assert.equal(session.selectedQuestions.length, 2);
    assert.equal(session.selectedQuestions[0]!.questionVersionId, 'qv1');
    assert.equal(session.selectedQuestions[1]!.questionVersionId, 'qv2');
  });

  it('playback and recording state preservation', () => {
    const session = makeMockSession({
      playbackState: { reading: { consumedPlays: 1, allowedPlays: 2 } },
      recordingState: { speaking: { recordingId: 'rec1', state: 'uploaded' } },
    });
    assert.equal(session.playbackState['reading']!.consumedPlays, 1);
    assert.equal(session.recordingState['speaking']!.state, 'uploaded');
  });

  it('navigation returns next task', () => {
    const session = makeMockSession({ currentTaskPosition: 0 });
    const next = getNextTask(session);
    assert.equal(next?.position, 1);
  });

  it('navigation returns null at end', () => {
    const session = makeMockSession({ currentTaskPosition: 1 });
    const next = getNextTask(session);
    assert.equal(next, null);
  });

  it('session state transitions', () => {
    assert.equal(canTransitionMock('created', 'ready'), true);
    assert.equal(canTransitionMock('ready', 'active'), true);
    assert.equal(canTransitionMock('active', 'submitting'), true);
    assert.equal(canTransitionMock('completed', 'active'), false);
    assert.equal(isTerminalMockState('completed'), true);
    assert.equal(isTerminalMockState('active'), false);
  });
});
