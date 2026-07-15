import type { QuestionTypeHandler, SubmissionValidationInput, SubmissionValidationResult } from '@pte-app/contracts';
import type { AnswerShortQuestion, AnswerShortQuestionResponse } from '@pte-app/contracts';
import { AnswerShortQuestionSchema, AnswerShortQuestionResponseSchema } from '@pte-app/schemas';
import { SPEAKING_MANIFEST_BASE } from './common.js';

export function createAnswerShortQuestionHandler(): QuestionTypeHandler<
  AnswerShortQuestion,
  AnswerShortQuestionResponse
> {
  return {
    manifest: { ...SPEAKING_MANIFEST_BASE, type: 'answer_short_question' },

    parseQuestion(input: unknown): AnswerShortQuestion {
      return AnswerShortQuestionSchema.parse(input);
    },

    parseResponse(input: unknown): AnswerShortQuestionResponse {
      return AnswerShortQuestionResponseSchema.parse(input);
    },

    createEmptyResponse(): AnswerShortQuestionResponse {
      return { recordingId: '' };
    },

    getResponseState(response: AnswerShortQuestionResponse): 'empty' | 'incomplete' | 'complete' | 'submitted' {
      if (!response.recordingId) return 'empty';
      return 'complete';
    },

    validateSubmission(
      input: SubmissionValidationInput<AnswerShortQuestionResponse, AnswerShortQuestion>,
    ): SubmissionValidationResult {
      const { response, allowsEmptySubmission } = input;
      if (!allowsEmptySubmission && !response.recordingId) {
        return { valid: false, reason: 'Recording is required' };
      }
      return { valid: true };
    },
  };
}
