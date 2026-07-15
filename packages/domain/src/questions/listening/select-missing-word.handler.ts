import type { QuestionTypeHandler, SubmissionValidationInput, SubmissionValidationResult } from '@pte-app/contracts';
import type { SelectMissingWordQuestion, SelectMissingWordResponse } from '@pte-app/contracts';
import { SelectMissingWordQuestionSchema, SelectMissingWordResponseSchema } from '@pte-app/schemas';
import { LISTENING_MANIFEST_BASE, validateListeningSubmission } from './common.js';

export function createSelectMissingWordHandler(): QuestionTypeHandler<
  SelectMissingWordQuestion,
  SelectMissingWordResponse
> {
  return {
    manifest: {
      ...LISTENING_MANIFEST_BASE,
      type: 'select_missing_word',
    },

    parseQuestion(input: unknown): SelectMissingWordQuestion {
      return SelectMissingWordQuestionSchema.parse(input);
    },

    parseResponse(input: unknown): SelectMissingWordResponse {
      return SelectMissingWordResponseSchema.parse(input);
    },

    createEmptyResponse(): SelectMissingWordResponse {
      return { selectedKey: null };
    },

    getResponseState(response: SelectMissingWordResponse): 'empty' | 'incomplete' | 'complete' | 'submitted' {
      if (response.selectedKey === null) return 'empty';
      return 'complete';
    },

    validateSubmission(
      input: SubmissionValidationInput<SelectMissingWordResponse, SelectMissingWordQuestion>,
    ): SubmissionValidationResult {
      const base = validateListeningSubmission(input, (r) => r.selectedKey === null);
      if (!base.valid) return base;

      const { response, question } = input;
      if (response.selectedKey !== null && question) {
        const validKeys = new Set(question.options.map((o) => o.key));
        if (!validKeys.has(response.selectedKey)) {
          return { valid: false, reason: `Unknown selected key: ${response.selectedKey}` };
        }
      }

      return { valid: true };
    },
  };
}
