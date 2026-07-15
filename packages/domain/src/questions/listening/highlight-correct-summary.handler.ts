import type { QuestionTypeHandler, SubmissionValidationInput, SubmissionValidationResult } from '@pte-app/contracts';
import type { HighlightCorrectSummaryQuestion, HighlightCorrectSummaryResponse } from '@pte-app/contracts';
import { HighlightCorrectSummaryQuestionSchema, HighlightCorrectSummaryResponseSchema } from '@pte-app/schemas';
import { LISTENING_MANIFEST_BASE, validateListeningSubmission } from './common.js';

export function createHighlightCorrectSummaryHandler(): QuestionTypeHandler<
  HighlightCorrectSummaryQuestion,
  HighlightCorrectSummaryResponse
> {
  return {
    manifest: {
      ...LISTENING_MANIFEST_BASE,
      type: 'highlight_correct_summary',
    },

    parseQuestion(input: unknown): HighlightCorrectSummaryQuestion {
      return HighlightCorrectSummaryQuestionSchema.parse(input);
    },

    parseResponse(input: unknown): HighlightCorrectSummaryResponse {
      return HighlightCorrectSummaryResponseSchema.parse(input);
    },

    createEmptyResponse(): HighlightCorrectSummaryResponse {
      return { selectedKey: null };
    },

    getResponseState(response: HighlightCorrectSummaryResponse): 'empty' | 'incomplete' | 'complete' | 'submitted' {
      if (response.selectedKey === null) return 'empty';
      return 'complete';
    },

    validateSubmission(
      input: SubmissionValidationInput<HighlightCorrectSummaryResponse, HighlightCorrectSummaryQuestion>,
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
