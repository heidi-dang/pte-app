import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createReadAloudHandler } from './read-aloud.handler.js';
import { createSummarizeGroupDiscussionHandler } from './summarize-group-discussion.handler.js';
import { createRepeatSentenceHandler } from './repeat-sentence.handler.js';
import { createAnswerShortQuestionHandler } from './answer-short-question.handler.js';
import { validateRecordingSubmission } from './common.js';
import type { ReadAloudQuestion } from '@pte-app/contracts';
import type { SummarizeGroupDiscussionQuestion } from '@pte-app/contracts';
import type { ValidatedRecordingContext } from './common.js';

function makeRecordingContext(overrides: Partial<ValidatedRecordingContext> = {}): ValidatedRecordingContext {
  return {
    recordingId: 'rec-123',
    userId: 'user-1',
    recordingProfileId: 'rp-1',
    state: 'available',
    finalisationState: 'finalised',
    uploadSessionId: null,
    uploadedChunkCount: 0,
    totalChunkCount: 0,
    durationMs: 5000,
    ...overrides,
  };
}

describe('Speaking Handler Validation', () => {
  describe('ReadAloud', () => {
    const handler = createReadAloudHandler();

    it('rejects empty recording', () => {
      const result = handler.validateSubmission({
        response: { recordingId: '' },
        question: null as unknown as ReadAloudQuestion,
        sessionMode: 'learning',
        allowsEmptySubmission: false,
        questionVersionId: 'qv1' as never,
        modeProfile: { id: 'mp1', mode: 'learning', maxAttempts: 1 } as never,
        scoringProfile: null,
      });
      assert.equal(result.valid, false);
      assert.ok(result.reason?.includes('required'));
    });

    it('accepts valid recording ID', () => {
      const result = handler.validateSubmission({
        response: { recordingId: 'rec-123' },
        question: null as unknown as ReadAloudQuestion,
        sessionMode: 'learning',
        allowsEmptySubmission: false,
        questionVersionId: 'qv1' as never,
        modeProfile: { id: 'mp1', mode: 'learning', maxAttempts: 1 } as never,
        scoringProfile: null,
      });
      assert.equal(result.valid, true);
    });
  });

  describe('SummarizeGroupDiscussion', () => {
    const handler = createSummarizeGroupDiscussionHandler();
    const question: SummarizeGroupDiscussionQuestion = {
      type: 'summarize_group_discussion',
      taskType: 'summarize_group_discussion',
      discussionTranscript: 'Some text here for discussion.',
      maxWords: 100,
      minWords: 10,
      scoringPrinciples: [],
    } as unknown as SummarizeGroupDiscussionQuestion;

    it('rejects empty recording', () => {
      const result = handler.validateSubmission({
        response: { recordingId: '' },
        question,
        sessionMode: 'learning',
        allowsEmptySubmission: false,
        questionVersionId: 'qv1' as never,
        modeProfile: { id: 'mp1', mode: 'learning', maxAttempts: 1 } as never,
        scoringProfile: null,
      });
      assert.equal(result.valid, false);
    });

    it('enforces minWords', () => {
      const result = handler.validateSubmission({
        response: { recordingId: 'r1', writtenSummary: 'too few words' },
        question,
        sessionMode: 'learning',
        allowsEmptySubmission: false,
        questionVersionId: 'qv1' as never,
        modeProfile: { id: 'mp1', mode: 'learning', maxAttempts: 1 } as never,
        scoringProfile: null,
      });
      assert.equal(result.valid, false);
      assert.ok(result.reason?.includes('below minimum'));
    });

    it('enforces maxWords', () => {
      const longText = Array(200).fill('word').join(' ');
      const result = handler.validateSubmission({
        response: { recordingId: 'r1', writtenSummary: longText },
        question,
        sessionMode: 'learning',
        allowsEmptySubmission: false,
        questionVersionId: 'qv1' as never,
        modeProfile: { id: 'mp1', mode: 'learning', maxAttempts: 1 } as never,
        scoringProfile: null,
      });
      assert.equal(result.valid, false);
      assert.ok(result.reason?.includes('exceeds maximum'));
    });

    it('rejects whitespace-only summary', () => {
      const result = handler.validateSubmission({
        response: { recordingId: 'r1', writtenSummary: '   ' },
        question,
        sessionMode: 'learning',
        allowsEmptySubmission: false,
        questionVersionId: 'qv1' as never,
        modeProfile: { id: 'mp1', mode: 'learning', maxAttempts: 1 } as never,
        scoringProfile: null,
      });
      assert.equal(result.valid, false);
      assert.ok(result.reason?.includes('whitespace'));
    });

    it('accepts valid submission', () => {
      const result = handler.validateSubmission({
        response: {
          recordingId: 'r1',
          writtenSummary: 'This is a valid summary with enough words to pass the minimum',
        },
        question,
        sessionMode: 'learning',
        allowsEmptySubmission: false,
        questionVersionId: 'qv1' as never,
        modeProfile: { id: 'mp1', mode: 'learning', maxAttempts: 1 } as never,
        scoringProfile: null,
      });
      assert.equal(result.valid, true);
    });

    it('returns incomplete when no written summary', () => {
      assert.equal(handler.getResponseState({ recordingId: 'r1' }), 'incomplete');
    });

    it('returns complete when both present', () => {
      assert.equal(handler.getResponseState({ recordingId: 'r1', writtenSummary: 'Hello world' }), 'complete');
    });
  });

  describe('RepeatSentence', () => {
    const handler = createRepeatSentenceHandler();

    it('getResponseState is complete when recordingId present', () => {
      assert.equal(handler.getResponseState({ recordingId: 'r1' }), 'complete');
    });
  });

  describe('AnswerShortQuestion', () => {
    const handler = createAnswerShortQuestionHandler();

    it('getResponseState is complete when recordingId present', () => {
      assert.equal(handler.getResponseState({ recordingId: 'r1' }), 'complete');
    });
  });

  describe('recording context validation (all handlers)', () => {
    const handler = createReadAloudHandler();
    const baseInput = (overrides: Record<string, unknown> = {}) => ({
      response: { recordingId: 'rec-123' },
      question: null as unknown as ReadAloudQuestion,
      sessionMode: 'learning',
      allowsEmptySubmission: false,
      questionVersionId: 'qv1' as never,
      modeProfile: { id: 'mp1', mode: 'learning', maxAttempts: 1 } as never,
      scoringProfile: null,
      ...overrides,
    });

    it('accepts valid recording with complete context', () => {
      const result = handler.validateSubmission(baseInput({ recordingContext: makeRecordingContext() }));
      assert.equal(result.valid, true);
    });

    it('rejects recording belonging to another user', () => {
      const result = validateRecordingSubmission(
        makeRecordingContext({ userId: 'other-user' }),
        'expected-user',
        false,
      );
      assert.equal(result.valid, false);
      assert.ok(result.reason?.includes('does not belong'));
    });

    it('rejects unfinalised recording', () => {
      const result = handler.validateSubmission(
        baseInput({
          recordingContext: makeRecordingContext({ finalisationState: 'pending' }),
        }),
      );
      assert.equal(result.valid, false);
      assert.ok(result.reason?.includes('not finalised'));
    });

    it('rejects abandoned recording', () => {
      const result = handler.validateSubmission(
        baseInput({
          recordingContext: makeRecordingContext({ state: 'abandoned' }),
        }),
      );
      assert.equal(result.valid, false);
      assert.ok(result.reason?.includes('terminal state'));
    });

    it('rejects expanded recording', () => {
      const result = handler.validateSubmission(
        baseInput({
          recordingContext: makeRecordingContext({ state: 'expired' }),
        }),
      );
      assert.equal(result.valid, false);
      assert.ok(result.reason?.includes('terminal state'));
    });

    it('rejects recording with in-progress upload', () => {
      const result = handler.validateSubmission(
        baseInput({
          recordingContext: makeRecordingContext({ state: 'uploading' }),
        }),
      );
      assert.equal(result.valid, false);
      assert.ok(result.reason?.includes('still in progress'));
    });

    it('rejects recording with missing chunks', () => {
      const result = handler.validateSubmission(
        baseInput({
          recordingContext: makeRecordingContext({
            uploadedChunkCount: 2,
            totalChunkCount: 5,
          }),
        }),
      );
      assert.equal(result.valid, false);
      assert.ok(result.reason?.includes('missing chunks'));
    });

    it('rejects recording with zero duration', () => {
      const result = handler.validateSubmission(
        baseInput({
          recordingContext: makeRecordingContext({ durationMs: 0 }),
        }),
      );
      assert.equal(result.valid, false);
      assert.ok(result.reason?.includes('duration'));
    });

    it('rejects whitespace-only recordingId in context', () => {
      const result = handler.validateSubmission(
        baseInput({
          recordingContext: makeRecordingContext({ recordingId: '   ' }),
        }),
      );
      assert.equal(result.valid, false);
      assert.ok(result.reason?.includes('whitespace'));
    });

    it('accepts empty submission when allowsEmptySubmission is true without context', () => {
      const result = handler.validateSubmission(
        baseInput({ response: { recordingId: '' }, allowsEmptySubmission: true }),
      );
      assert.equal(result.valid, true);
    });
  });
});
