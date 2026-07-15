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

    validateSubmission(
      input: SubmissionValidationInput<ListeningMultipleAnswersResponse, ListeningMultipleAnswersQuestion>,
    ): SubmissionValidationResult {
      const base = validateListeningSubmission(input, (r) => r.selectedKeys.length === 0);
      if (!base.valid) return base;

      const { response, question } = input;

      const seen = new Set<string>();
      for (const key of response.selectedKeys) {
        if (seen.has(key)) {
          return { valid: false, reason: `Duplicate selected key: ${key}` };
        }
        seen.add(key);
      }

      if (question) {
        const validKeys = new Set(question.options.map((o) => o.key));
        for (const key of response.selectedKeys) {
          if (!validKeys.has(key)) {
            return { valid: false, reason: `Unknown selected key: ${key}` };
          }
        }
        if (response.selectedKeys.length > question.maxSelections) {
          return {
            valid: false,
            reason: `Too many selections: ${response.selectedKeys.length} > ${question.maxSelections}`,
          };
        }
      }

      return { valid: true };
    },
  };
}
