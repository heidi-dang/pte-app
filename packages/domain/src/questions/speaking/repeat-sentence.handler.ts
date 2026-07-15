import type { QuestionTypeHandler, SubmissionValidationInput, SubmissionValidationResult } from '@pte-app/contracts';
import type { RepeatSentenceQuestion, RepeatSentenceResponse } from '@pte-app/contracts';
import { RepeatSentenceQuestionSchema, RepeatSentenceResponseSchema } from '@pte-app/schemas';
import { SPEAKING_MANIFEST_BASE } from './common.js';

export function createRepeatSentenceHandler(): QuestionTypeHandler<RepeatSentenceQuestion, RepeatSentenceResponse> {
  return {
    manifest: { ...SPEAKING_MANIFEST_BASE, type: 'repeat_sentence' },

    parseQuestion(input: unknown): RepeatSentenceQuestion {
      return RepeatSentenceQuestionSchema.parse(input);
    },

    parseResponse(input: unknown): RepeatSentenceResponse {
      return RepeatSentenceResponseSchema.parse(input);
    },

    createEmptyResponse(): RepeatSentenceResponse {
      return { recordingId: '' };
    },

    getResponseState(response: RepeatSentenceResponse): 'empty' | 'incomplete' | 'complete' | 'submitted' {
      if (!response.recordingId) return 'empty';
      return 'complete';
    },

    validateSubmission(
      input: SubmissionValidationInput<RepeatSentenceResponse, RepeatSentenceQuestion>,
    ): SubmissionValidationResult {
      const { response, allowsEmptySubmission } = input;
      if (!allowsEmptySubmission && !response.recordingId) {
        return { valid: false, reason: 'Recording is required' };
      }
      return { valid: true };
    },
  };
}
