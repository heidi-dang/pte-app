import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createReadAloudHandler } from './read-aloud.handler.js';
import { createSummarizeGroupDiscussionHandler } from './summarize-group-discussion.handler.js';
import { createRepeatSentenceHandler } from './repeat-sentence.handler.js';
import { createAnswerShortQuestionHandler } from './answer-short-question.handler.js';
import type { ReadAloudQuestion } from '@pte-app/contracts';
import type { SummarizeGroupDiscussionQuestion } from '@pte-app/contracts';

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
});
