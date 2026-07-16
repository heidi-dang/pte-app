import type { QuestionTypeHandler, SubmissionValidationInput, SubmissionValidationResult } from '@pte-app/contracts';
import type { ListeningSingleAnswerQuestion, ListeningSingleAnswerResponse } from '@pte-app/contracts';
import { ListeningSingleAnswerQuestionSchema, ListeningSingleAnswerResponseSchema } from '@pte-app/schemas';
import { LISTENING_MANIFEST_BASE, validateListeningSubmission } from './common.js';

export function createListeningSingleAnswerHandler(): QuestionTypeHandler<
  ListeningSingleAnswerQuestion,
  ListeningSingleAnswerResponse
> {
  return {
    manifest: {
      ...LISTENING_MANIFEST_BASE,
      type: 'listening_single_answer',
    },

    parseQuestion(input: unknown): ListeningSingleAnswerQuestion {
      return ListeningSingleAnswerQuestionSchema.parse(input);
    },

    parseResponse(input: unknown): ListeningSingleAnswerResponse {
      return ListeningSingleAnswerResponseSchema.parse(input);
    },

    createEmptyResponse(): ListeningSingleAnswerResponse {
      return { selectedKey: null };
    },

    getResponseState(response: ListeningSingleAnswerResponse): 'empty' | 'incomplete' | 'complete' | 'submitted' {
      if (response.selectedKey === null) return 'empty';
      return 'complete';
    },

    validateSubmission(
      input: SubmissionValidationInput<ListeningSingleAnswerResponse, ListeningSingleAnswerQuestion>,
    ): SubmissionValidationResult {
      const base = validateListeningSubmission(input, (r) => r.selectedKey === null);
      if (!base.valid) return base;

      const { response, question } = input;
      if (response.selectedKey !== null) {
        const validKeys = new Set(question.options.map((o) => o.key));
        if (!validKeys.has(response.selectedKey)) {
          return { valid: false, reason: `Unknown selected key: ${response.selectedKey}` };
        }
      }

      return { valid: true };
    },
  };
}
