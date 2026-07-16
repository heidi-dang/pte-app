import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type {
  QuestionSessionModeProfile,
  ScoringProfileId,
  QuestionSessionMode,
  QuestionVersionId,
} from '@pte-app/contracts';
import {
  resolveModeProfile,
  getCapabilities,
  validateNoDuplicateVersions,
  type ModeProfileStore,
} from './mode-profile-resolver.js';
import { resolveTimerDisplayProfile, type TimerDisplayProfileStore } from './timer-display-resolver.js';
import { DEV_TIMER_DISPLAY_PROFILE_FIXTURE, TEST_TIMER_DISPLAY_PROFILE } from './timer-display-profiles.fixture.js';
import { createHandlerRegistry } from './renderer-registry.js';
import {
  scoreReadingMultipleChoiceMultiple,
  scoreReadingMultipleChoiceSingle,
  scoreReadingReorderParagraph,
  type ReadingScoringProfile,
} from '../questions/reading/scoring.js';
import {
  scoreListeningMultipleChoiceMultiple,
  scoreListeningMultipleChoiceSingle,
  scoreListeningFillBlanks,
  scoreHighlightIncorrectWords,
  type ListeningScoringProfile,
} from '../questions/listening/scoring.js';
import { createReorderParagraphHandler } from '../questions/reading/reorder-paragraph.handler.js';
import { createReadingMultipleChoiceMultipleHandler } from '../questions/reading/multiple-choice-multiple.handler.js';
import { createReadingMultipleChoiceSingleHandler } from '../questions/reading/multiple-choice-single.handler.js';
import { createListeningMultipleAnswersHandler } from '../questions/listening/multiple-choice-multiple.handler.js';
import { createReadingFillBlanksHandler } from '../questions/reading/reading-fill-blanks.handler.js';
import type { ReadingFillBlanksQuestion, ReorderParagraphQuestion } from '@pte-app/contracts';
import { getTranscriptPolicy } from '../questions/listening/transcript-policy.js';

function makeScoringProfile(overrides: Partial<ReadingScoringProfile> = {}): ReadingScoringProfile {
  return {
    id: 'sp_test' as ScoringProfileId,
    version: 1,
    correctCredit: 1,
    incorrectDeduction: 0.25,
    minimumResult: 0,
    maximumResult: 1,
    ...overrides,
  };
}

function makeListeningScoringProfile(overrides: Partial<ListeningScoringProfile> = {}): ListeningScoringProfile {
  return {
    id: 'lsp_test' as ScoringProfileId,
    version: 1,
    correctCredit: 1,
    incorrectDeduction: 0.25,
    minimumResult: 0,
    maximumResult: 1,
    ...overrides,
  };
}

function makeModeProfile(
  mode: QuestionSessionMode,
  version: number,
  overrides: Partial<QuestionSessionModeProfile> = {},
): QuestionSessionModeProfile {
  return {
    id: `mp_${mode}_v${version}`,
    version,
    mode,
    capabilities: {
      canPause: false,
      showsFeedback: false,
      showsCorrectAnswer: false,
      usesServerDeadline: false,
      allowsReview: false,
      allowsPlayback: false,
      allowsAutosave: false,
      allowsEmptySubmission: false,
    },
    ...overrides,
  };
}

function createModeStore(profiles: QuestionSessionModeProfile[]): ModeProfileStore {
  const map = new Map<string, QuestionSessionModeProfile>();
  for (const p of profiles) {
    map.set(`${p.mode}:${p.version}`, p);
  }
  return {
    find(mode: QuestionSessionMode, version: number) {
      return map.get(`${mode}:${version}`);
    },
    list(mode: QuestionSessionMode) {
      return profiles.filter((p) => p.mode === mode);
    },
  };
}

function createStore(
  entries: Array<[string, { refreshIntervalMs: number; warningThresholdsMs: number[] }]>,
): TimerDisplayProfileStore {
  const map = new Map(entries);
  return {
    get(id: string) {
      return map.get(id);
    },
  };
}

describe('question-engine', () => {
  describe('mode-profile resolution', () => {
    it('returns the latest version when no version is specified', () => {
      const p1 = makeModeProfile('learning', 1);
      const p2 = makeModeProfile('learning', 3);
      const p3 = makeModeProfile('learning', 2);
      const store = createModeStore([p1, p2, p3]);
      const resolved = resolveModeProfile(store, 'learning');
      assert.equal(resolved.id, p2.id);
      assert.equal(resolved.version, 3);
    });

    it('returns the exact version when specified', () => {
      const p1 = makeModeProfile('learning', 1);
      const p2 = makeModeProfile('learning', 2);
      const store = createModeStore([p1, p2]);
      const resolved = resolveModeProfile(store, 'learning', 1);
      assert.equal(resolved.id, p1.id);
    });

    it('throws MISSING_MODE_PROFILE when no profiles exist', () => {
      const store = createModeStore([]);
      assert.throws(
        () => resolveModeProfile(store, 'learning'),
        (err: Error) => {
          assert.equal(err.message.includes('No mode profiles found'), true);
          return true;
        },
      );
    });

    it('throws MISSING_MODE_PROFILE when version not found', () => {
      const p1 = makeModeProfile('learning', 1);
      const store = createModeStore([p1]);
      assert.throws(
        () => resolveModeProfile(store, 'learning', 5),
        (err: Error) => {
          assert.equal(err.message.includes('No mode profile found'), true);
          return true;
        },
      );
    });

    it('throws INCOMPATIBLE_MODE_PROFILE for invalid version', () => {
      const store = createModeStore([]);
      assert.throws(
        () => resolveModeProfile(store, 'learning', 0),
        (err: Error) => {
          assert.equal(err.message.includes('Invalid mode profile version'), true);
          return true;
        },
      );
    });

    it('getCapabilities returns the capabilities from the profile', () => {
      const p = makeModeProfile('learning', 1, {
        capabilities: {
          canPause: true,
          showsFeedback: true,
          showsCorrectAnswer: false,
          usesServerDeadline: false,
          allowsReview: true,
          allowsPlayback: true,
          allowsAutosave: true,
          allowsEmptySubmission: false,
        },
      });
      const caps = getCapabilities(p);
      assert.equal(caps.canPause, true);
      assert.equal(caps.allowsPlayback, true);
    });

    it('validateNoDuplicateVersions throws on duplicate', () => {
      const p1 = makeModeProfile('learning', 1);
      const p2 = makeModeProfile('learning', 1);
      assert.throws(
        () => validateNoDuplicateVersions([p1, p2]),
        (err: Error) => {
          assert.equal(err.message.includes('Duplicate mode profile version'), true);
          return true;
        },
      );
    });

    it('validateNoDuplicateVersions passes with distinct versions', () => {
      const p1 = makeModeProfile('learning', 1);
      const p2 = makeModeProfile('learning', 2);
      assert.doesNotThrow(() => validateNoDuplicateVersions([p1, p2]));
    });
  });

  describe('timer display profile resolution', () => {
    it('throws MISSING_TIMER_DISPLAY_PROFILE when no profile ID given', () => {
      const store = createStore([]);
      assert.throws(
        () => resolveTimerDisplayProfile(store, undefined),
        (err: Error) => {
          assert.equal(err.message.includes('Timer display profile ID is required'), true);
          return true;
        },
      );
    });

    it('returns profile from store when found', () => {
      const store = createStore([['custom_timer', TEST_TIMER_DISPLAY_PROFILE]]);
      const resolved = resolveTimerDisplayProfile(store, 'custom_timer');
      assert.deepEqual(resolved, TEST_TIMER_DISPLAY_PROFILE);
    });

    it('throws MISSING_TIMER_DISPLAY_PROFILE when profile not found', () => {
      const store = createStore([]);
      assert.throws(
        () => resolveTimerDisplayProfile(store, 'nonexistent'),
        (err: Error) => {
          assert.equal(err.message.includes('No timer display profile found'), true);
          return true;
        },
      );
    });

    it('dev fixture is only used when explicitly supplied', () => {
      const store = createStore([['dev_fixture', DEV_TIMER_DISPLAY_PROFILE_FIXTURE]]);
      const resolved = resolveTimerDisplayProfile(store, 'dev_fixture');
      assert.equal(resolved.refreshIntervalMs, 1000);
      assert.deepEqual(resolved.warningThresholdsMs, [60_000, 30_000, 10_000]);
    });

    it('no production default exists — missing ID always throws', () => {
      const store = createStore([]);
      assert.throws(
        () => resolveTimerDisplayProfile(store, undefined),
        (err: Error) => {
          assert.equal(err.message.includes('Timer display profile ID is required'), true);
          return true;
        },
      );
    });
  });

  describe('reading scoring', () => {
    const profile = makeScoringProfile();

    it('MCQ-M: scores correct selections positively (clamped to maximumResult)', () => {
      const wideProfile = makeScoringProfile({ maximumResult: 3 });
      const score = scoreReadingMultipleChoiceMultiple(['A', 'C'], ['A', 'C', 'D'], wideProfile);
      assert.equal(score, 2);
    });

    it('MCQ-M: penalises incorrect selections', () => {
      const score = scoreReadingMultipleChoiceMultiple(['A', 'B'], ['A', 'C'], profile);
      assert.equal(score, 0.75);
    });

    it('MCQ-M: clamps to minimumResult', () => {
      const score = scoreReadingMultipleChoiceMultiple(['A', 'B', 'D', 'E'], ['C'], {
        ...profile,
        incorrectDeduction: 0.5,
        minimumResult: 0,
      });
      assert.equal(score, 0);
    });

    it('MCQ-M: scorer prevents duplicate credit — repeated correct ID credited once', () => {
      const score = scoreReadingMultipleChoiceMultiple(['A', 'A', 'A'], ['A'], profile);
      assert.equal(score, 1);
    });

    it('MCQ-M: scorer prevents duplicate deduction — repeated incorrect ID deducted once', () => {
      const unclampedProfile = makeScoringProfile({ minimumResult: -1 });
      const score = scoreReadingMultipleChoiceMultiple(['B', 'B'], ['A'], unclampedProfile);
      assert.equal(score, -0.25);
    });

    it('MCQ-S: scores correct answer with correctCredit', () => {
      const score = scoreReadingMultipleChoiceSingle('A', 'A', profile);
      assert.equal(score, 1);
    });

    it('MCQ-S: returns minimumResult for incorrect', () => {
      const score = scoreReadingMultipleChoiceSingle('B', 'A', profile);
      assert.equal(score, 0);
    });

    it('MCQ-S: returns 0 for null selection', () => {
      const score = scoreReadingMultipleChoiceSingle(null, 'A', profile);
      assert.equal(score, 0);
    });

    it('Reorder: scores adjacent pairs only', () => {
      const correctOrder = ['p1', 'p2', 'p3', 'p4'];
      const ordered = ['p1', 'p2', 'p4', 'p3'];
      const score = scoreReadingReorderParagraph(ordered, correctOrder, profile);
      assert.equal(score, 1 / 3);
    });

    it('Reorder: full score for perfect order', () => {
      const score = scoreReadingReorderParagraph(['p1', 'p2', 'p3'], ['p1', 'p2', 'p3'], profile);
      assert.equal(score, 1);
    });

    it('Reorder: returns minimumResult for empty', () => {
      const score = scoreReadingReorderParagraph([], ['p1', 'p2'], profile);
      assert.equal(score, 0);
    });

    it('Reorder: does not credit non-adjacent pairs (fix)', () => {
      const correctOrder = ['p1', 'p2', 'p3', 'p4'];
      const ordered = ['p3', 'p1', 'p2', 'p4'];
      const score = scoreReadingReorderParagraph(ordered, correctOrder, profile);
      assert.equal(score, 1 / 3);
    });
  });

  describe('listening scoring', () => {
    const profile = makeListeningScoringProfile();

    it('MCQ-M: scores correctly (clamped to maximumResult)', () => {
      const wideProfile = makeListeningScoringProfile({ maximumResult: 3 });
      const score = scoreListeningMultipleChoiceMultiple(['A', 'B'], ['A', 'B'], wideProfile);
      assert.equal(score, 2);
    });

    it('MCQ-M: scorer prevents duplicate credit — repeated correct ID credited once', () => {
      const score = scoreListeningMultipleChoiceMultiple(['A', 'A'], ['A'], profile);
      assert.equal(score, 1);
    });

    it('MCQ-M: scorer prevents duplicate deduction — repeated incorrect ID deducted once', () => {
      const unclampedProfile = makeListeningScoringProfile({ minimumResult: -1 });
      const score = scoreListeningMultipleChoiceMultiple(['B', 'B'], ['A'], unclampedProfile);
      assert.equal(score, -0.25);
    });

    it('MCQ-S: scores correctly', () => {
      const score = scoreListeningMultipleChoiceSingle('X', 'X', profile);
      assert.equal(score, 1);
    });

    it('MCQ-S: null returns 0', () => {
      const score = scoreListeningMultipleChoiceSingle(null, 'X', profile);
      assert.equal(score, 0);
    });

    it('Fill blanks: case-insensitive by default', () => {
      const score = scoreListeningFillBlanks({ '0': 'Hello', '1': 'World' }, { '0': 'hello', '1': 'world' }, profile);
      assert.equal(score, 1);
    });

    it('Fill blanks: case-sensitive when profile specifies', () => {
      const caseSensitiveProfile = makeListeningScoringProfile({ caseSensitive: true });
      const score = scoreListeningFillBlanks({ '0': 'Hello' }, { '0': 'hello' }, caseSensitiveProfile);
      assert.equal(score, 0);
    });

    it('Highlight incorrect words: F1 score', () => {
      const score = scoreHighlightIncorrectWords([0, 2, 4], [0, 2, 3], profile);
      assert.ok(score > 0 && score <= 1);
    });

    it('Highlight incorrect words: perfect score', () => {
      const score = scoreHighlightIncorrectWords([0, 1, 2], [0, 1, 2], profile);
      assert.equal(score, 1);
    });

    it('Highlight incorrect words: empty returns minimumResult', () => {
      const score = scoreHighlightIncorrectWords([], [], profile);
      assert.equal(score, 0);
    });
  });

  describe('handler registry', () => {
    it('registers and resolves handlers', () => {
      const registry = createHandlerRegistry();
      registry.register(createReadingMultipleChoiceMultipleHandler());
      registry.register(createReadingMultipleChoiceSingleHandler());
      registry.register(createReorderParagraphHandler());
      registry.register(createListeningMultipleAnswersHandler());

      const types = registry.listRegistered();
      assert.ok(types.includes('reading_multiple_answers'));
      assert.ok(types.includes('reading_single_answer'));
      assert.ok(types.includes('reorder_paragraph'));
      assert.ok(types.includes('listening_multiple_answers'));
    });

    it('throws UNSUPPORTED_QUESTION_TYPE for unknown type', () => {
      const registry = createHandlerRegistry();
      assert.throws(
        () => registry.resolve('nonexistent_type'),
        (err: Error) => {
          assert.equal(err.message.includes('No question type handler registered'), true);
          return true;
        },
      );
    });

    it('throws when registering duplicate type', () => {
      const registry = createHandlerRegistry();
      registry.register(createReadingMultipleChoiceMultipleHandler());
      assert.throws(
        () => registry.register(createReadingMultipleChoiceMultipleHandler()),
        (err: Error) => {
          assert.equal(err.message.includes('already registered'), true);
          return true;
        },
      );
    });
  });

  describe('transcript policy', () => {
    it('returns showDuringAttempt true for fill-blanks', () => {
      const policy = getTranscriptPolicy('listening_fill_blanks');
      assert.equal(policy.showDuringAttempt, true);
      assert.equal(policy.showDuringReview, true);
    });

    it('returns showDuringAttempt false for write-from-dictation', () => {
      const policy = getTranscriptPolicy('write_from_dictation');
      assert.equal(policy.showDuringAttempt, false);
    });

    it('returns conservative defaults for unknown type', () => {
      const policy = getTranscriptPolicy('unknown_type');
      assert.equal(policy.showDuringAttempt, false);
      assert.equal(policy.showDuringReview, false);
      assert.equal(policy.showCorrectAnswersInReview, false);
    });
  });

  describe('handler duplicate rejection', () => {
    it('reading handler rejects duplicate correct selection — invalid', () => {
      const handler = createReadingMultipleChoiceMultipleHandler();
      const question = handler.parseQuestion({
        type: 'reading_multiple_answers',
        instructions: 'Select all',
        passage: { id: 'p1', text: 'Test', wordCount: 1 },
        questionStem: 'Test?',
        options: [
          { key: 'A', text: 'Option A' },
          { key: 'B', text: 'Option B' },
        ],
        minSelections: 1,
        maxSelections: 2,
      });
      const response = { selectedKeys: ['A', 'A'] };
      const result = handler.validateSubmission({
        response,
        sessionMode: 'learning',
        allowsEmptySubmission: false,
        question,
        questionVersionId: 'qv_1' as QuestionVersionId,
        modeProfile: { id: 'mp_1', version: 1, mode: 'learning' },
        scoringProfile: null,
      });
      assert.equal(result.valid, false);
      assert.ok(result.reason?.includes('Duplicate'));
    });

    it('reading handler rejects duplicate incorrect selection — invalid', () => {
      const handler = createReadingMultipleChoiceMultipleHandler();
      const question = handler.parseQuestion({
        type: 'reading_multiple_answers',
        instructions: 'Select all',
        passage: { id: 'p1', text: 'Test', wordCount: 1 },
        questionStem: 'Test?',
        options: [
          { key: 'A', text: 'Option A' },
          { key: 'B', text: 'Option B' },
        ],
        minSelections: 1,
        maxSelections: 2,
      });
      const response = { selectedKeys: ['Z', 'Z'] };
      const result = handler.validateSubmission({
        response,
        sessionMode: 'learning',
        allowsEmptySubmission: false,
        question,
        questionVersionId: 'qv_1' as QuestionVersionId,
        modeProfile: { id: 'mp_1', version: 1, mode: 'learning' },
        scoringProfile: null,
      });
      assert.equal(result.valid, false);
      assert.ok(result.reason?.includes('Duplicate'));
    });

    it('reading handler rejects unknown selected key — invalid', () => {
      const handler = createReadingMultipleChoiceMultipleHandler();
      const question = handler.parseQuestion({
        type: 'reading_multiple_answers',
        instructions: 'Select all',
        passage: { id: 'p1', text: 'Test', wordCount: 1 },
        questionStem: 'Test?',
        options: [
          { key: 'A', text: 'Option A' },
          { key: 'B', text: 'Option B' },
        ],
        minSelections: 1,
        maxSelections: 2,
      });
      const response = { selectedKeys: ['Z'] };
      const result = handler.validateSubmission({
        response,
        sessionMode: 'learning',
        allowsEmptySubmission: false,
        question,
        questionVersionId: 'qv_1' as QuestionVersionId,
        modeProfile: { id: 'mp_1', version: 1, mode: 'learning' },
        scoringProfile: null,
      });
      assert.equal(result.valid, false);
      assert.ok(result.reason?.includes('Unknown'));
    });

    it('reorder handler rejects duplicate IDs — invalid', () => {
      const handler = createReorderParagraphHandler();
      const question = handler.parseQuestion({
        type: 'reorder_paragraph',
        instructions: 'Reorder',
        items: [
          { id: 'p1', text: 'First' },
          { id: 'p2', text: 'Second' },
        ],
      });
      const response = { orderedIds: ['p1', 'p1'] };
      const result = handler.validateSubmission({
        response,
        sessionMode: 'learning',
        allowsEmptySubmission: false,
        question,
        questionVersionId: 'qv_1' as QuestionVersionId,
        modeProfile: { id: 'mp_1', version: 1, mode: 'learning' },
        scoringProfile: null,
      });
      assert.equal(result.valid, false);
      assert.ok(result.reason?.includes('Duplicate'));
    });

    it('reorder handler rejects unknown IDs — invalid', () => {
      const handler = createReorderParagraphHandler();
      const question = handler.parseQuestion({
        type: 'reorder_paragraph',
        instructions: 'Reorder',
        items: [
          { id: 'p1', text: 'First' },
          { id: 'p2', text: 'Second' },
        ],
      });
      const response = { orderedIds: ['p1', 'unknown_id'] };
      const result = handler.validateSubmission({
        response,
        sessionMode: 'learning',
        allowsEmptySubmission: false,
        question,
        questionVersionId: 'qv_1' as QuestionVersionId,
        modeProfile: { id: 'mp_1', version: 1, mode: 'learning' },
        scoringProfile: null,
      });
      assert.equal(result.valid, false);
      assert.ok(result.reason?.includes('Unknown'));
    });

    it('listening handler rejects duplicate selections — invalid', () => {
      const handler = createListeningMultipleAnswersHandler();
      const question = handler.parseQuestion({
        type: 'listening_multiple_answers',
        instructions: 'Select all',
        questionStem: 'Test?',
        options: [
          { key: 'A', text: 'Option A' },
          { key: 'B', text: 'Option B' },
        ],
        minSelections: 1,
        maxSelections: 2,
      });
      const response = { selectedKeys: ['A', 'A'] };
      const result = handler.validateSubmission({
        response,
        sessionMode: 'learning',
        allowsEmptySubmission: false,
        question,
        questionVersionId: 'qv_1' as QuestionVersionId,
        modeProfile: { id: 'mp_1', version: 1, mode: 'learning' },
        scoringProfile: null,
      });
      assert.equal(result.valid, false);
      assert.ok(result.reason?.includes('Duplicate'));
    });

    it('listening handler rejects unknown selected key — invalid', () => {
      const handler = createListeningMultipleAnswersHandler();
      const question = handler.parseQuestion({
        type: 'listening_multiple_answers',
        instructions: 'Select all',
        questionStem: 'Test?',
        options: [
          { key: 'A', text: 'Option A' },
          { key: 'B', text: 'Option B' },
        ],
        minSelections: 1,
        maxSelections: 2,
      });
      const response = { selectedKeys: ['X'] };
      const result = handler.validateSubmission({
        response,
        sessionMode: 'learning',
        allowsEmptySubmission: false,
        question,
        questionVersionId: 'qv_1' as QuestionVersionId,
        modeProfile: { id: 'mp_1', version: 1, mode: 'learning' },
        scoringProfile: null,
      });
      assert.equal(result.valid, false);
      assert.ok(result.reason?.includes('Unknown'));
    });

    it('empty response remains valid where permitted', () => {
      const handler = createReadingMultipleChoiceMultipleHandler();
      const question = handler.parseQuestion({
        type: 'reading_multiple_answers',
        instructions: 'Select all',
        passage: { id: 'p1', text: 'Test', wordCount: 1 },
        questionStem: 'Test?',
        options: [
          { key: 'A', text: 'Option A' },
          { key: 'B', text: 'Option B' },
        ],
        minSelections: 1,
        maxSelections: 2,
      });
      const result = handler.validateSubmission({
        response: { selectedKeys: [] },
        sessionMode: 'learning',
        allowsEmptySubmission: true,
        question,
        questionVersionId: 'qv_1' as QuestionVersionId,
        modeProfile: { id: 'mp_1', version: 1, mode: 'learning' },
        scoringProfile: null,
      });
      assert.equal(result.valid, true);
    });
  });

  describe('Phase J — ReadingFillBlanks validation', () => {
    const handler = createReadingFillBlanksHandler();
    const question: ReadingFillBlanksQuestion = {
      type: 'reading_fill_blanks',
      passage: { id: 'p1', text: 'Test', wordCount: 5 },
      instructions: 'Fill',
      gaps: [{ index: 0 }, { index: 1 }],
      tokens: [
        { id: 't1', text: 'in' },
        { id: 't2', text: 'blanks' },
      ],
    };

    it('valid placement for existing gap passes', () => {
      const result = handler.validateSubmission({
        response: { placements: { '0': 't1', '1': 't2' } },
        question,
        sessionMode: 'learning',
        allowsEmptySubmission: false,
        questionVersionId: 'qv1' as QuestionVersionId,
        modeProfile: { id: 'mp1', version: 1, mode: 'learning' },
        scoringProfile: null,
      });
      assert.equal(result.valid, true);
    });

    it('placement for non-existent gap fails', () => {
      const result = handler.validateSubmission({
        response: { placements: { '99': 't1' } },
        question,
        sessionMode: 'learning',
        allowsEmptySubmission: true,
        questionVersionId: 'qv1' as QuestionVersionId,
        modeProfile: { id: 'mp1', version: 1, mode: 'learning' },
        scoringProfile: null,
      });
      assert.equal(result.valid, false);
      assert.ok(result.reason?.includes('Invalid gap index'));
    });

    it('unknown token still fails', () => {
      const result = handler.validateSubmission({
        response: { placements: { '0': 'unknown_token' } },
        question,
        sessionMode: 'learning',
        allowsEmptySubmission: true,
        questionVersionId: 'qv1' as QuestionVersionId,
        modeProfile: { id: 'mp1', version: 1, mode: 'learning' },
        scoringProfile: null,
      });
      assert.equal(result.valid, false);
      assert.ok(result.reason?.includes('Unknown token'));
    });
  });

  describe('Phase J — ReorderParagraph validation', () => {
    const handler = createReorderParagraphHandler();
    const question: ReorderParagraphQuestion = {
      type: 'reorder_paragraph',
      instructions: 'Order',
      items: [
        { id: 'p1', text: 'First' },
        { id: 'p2', text: 'Second' },
        { id: 'p3', text: 'Third' },
      ],
    };

    it('full valid ordering passes', () => {
      const result = handler.validateSubmission({
        response: { orderedIds: ['p1', 'p2', 'p3'] },
        question,
        sessionMode: 'learning',
        allowsEmptySubmission: false,
        questionVersionId: 'qv1' as QuestionVersionId,
        modeProfile: { id: 'mp1', version: 1, mode: 'learning' },
        scoringProfile: null,
      });
      assert.equal(result.valid, true);
    });

    it('partial ordering fails', () => {
      const result = handler.validateSubmission({
        response: { orderedIds: ['p1', 'p2'] },
        question,
        sessionMode: 'learning',
        allowsEmptySubmission: false,
        questionVersionId: 'qv1' as QuestionVersionId,
        modeProfile: { id: 'mp1', version: 1, mode: 'learning' },
        scoringProfile: null,
      });
      assert.equal(result.valid, false);
    });

    it('duplicate item fails', () => {
      const result = handler.validateSubmission({
        response: { orderedIds: ['p1', 'p1', 'p3'] },
        question,
        sessionMode: 'learning',
        allowsEmptySubmission: false,
        questionVersionId: 'qv1' as QuestionVersionId,
        modeProfile: { id: 'mp1', version: 1, mode: 'learning' },
        scoringProfile: null,
      });
      assert.equal(result.valid, false);
      assert.ok(result.reason?.includes('Duplicate'));
    });

    it('unknown item fails', () => {
      const result = handler.validateSubmission({
        response: { orderedIds: ['p1', 'p2', 'unknown_id'] },
        question,
        sessionMode: 'learning',
        allowsEmptySubmission: false,
        questionVersionId: 'qv1' as QuestionVersionId,
        modeProfile: { id: 'mp1', version: 1, mode: 'learning' },
        scoringProfile: null,
      });
      assert.equal(result.valid, false);
      assert.ok(result.reason?.includes('Unknown'));
    });
  });
});
