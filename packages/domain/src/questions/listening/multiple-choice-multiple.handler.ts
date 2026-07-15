import type { QuestionTypeHandler, SubmissionValidationInput, SubmissionValidationResult } from '@pte-app/contracts';
import type { ListeningMultipleAnswersQuestion, ListeningMultipleAnswersResponse } from '@pte-app/contracts';
import { ListeningMultipleAnswersQuestionSchema, ListeningMultipleAnswersResponseSchema } from '@pte-app/schemas';
import { LISTENING_MANIFEST_BASE, validateListeningSubmission } from './common.js';

export function createListeningMultipleAnswersHandler(): QuestionTypeHandler<
  ListeningMultipleAnswersQuestion,
  ListeningMultipleAnswersResponse
> {
  return {
    manifest: {
      ...LISTENING_MANIFEST_BASE,
      type: 'listening_multiple_answers',
    },

    parseQuestion(input: unknown): ListeningMultipleAnswersQuestion {
      return ListeningMultipleAnswersQuestionSchema.parse(input);
    },

    parseResponse(input: unknown): ListeningMultipleAnswersResponse {
      return ListeningMultipleAnswersResponseSchema.parse(input);
    },

    createEmptyResponse(): ListeningMultipleAnswersResponse {
      return { selectedKeys: [] };
    },

    getResponseState(response: ListeningMultipleAnswersResponse): 'empty' | 'incomplete' | 'complete' | 'submitted' {
      if (response.selectedKeys.length === 0) return 'empty';
      return 'complete';
    },

    validateSubmission(input: SubmissionValidationInput<ListeningMultipleAnswersResponse>): SubmissionValidationResult {
      return validateListeningSubmission(input, (r) => r.selectedKeys.length === 0);
    },
  };
}
