import type { QuestionTypeHandler, SubmissionValidationInput, SubmissionValidationResult } from '@pte-app/contracts';
import type { ReadAloudQuestion, ReadAloudResponse } from '@pte-app/contracts';
import { ReadAloudQuestionSchema, ReadAloudResponseSchema } from '@pte-app/schemas';
import { SPEAKING_MANIFEST_BASE } from './common.js';

export function createReadAloudHandler(): QuestionTypeHandler<ReadAloudQuestion, ReadAloudResponse> {
  return {
    manifest: { ...SPEAKING_MANIFEST_BASE, type: 'read_aloud' },

    parseQuestion(input: unknown): ReadAloudQuestion {
      return ReadAloudQuestionSchema.parse(input);
    },

    parseResponse(input: unknown): ReadAloudResponse {
      return ReadAloudResponseSchema.parse(input);
    },

    createEmptyResponse(): ReadAloudResponse {
      return { recordingId: '' };
    },

    getResponseState(response: ReadAloudResponse): 'empty' | 'incomplete' | 'complete' | 'submitted' {
      if (!response.recordingId) return 'empty';
      return 'complete';
    },

    validateSubmission(
      input: SubmissionValidationInput<ReadAloudResponse, ReadAloudQuestion>,
    ): SubmissionValidationResult {
      const { response, allowsEmptySubmission } = input;
      if (!allowsEmptySubmission && !response.recordingId) {
        return { valid: false, reason: 'Recording is required' };
      }
      return { valid: true };
    },
  };
}
