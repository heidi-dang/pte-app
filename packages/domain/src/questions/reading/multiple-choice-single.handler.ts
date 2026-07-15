import type { QuestionTypeHandler, SubmissionValidationInput, SubmissionValidationResult } from '@pte-app/contracts';
import type { ReadingMultipleChoiceSingleQuestion, ReadingMultipleChoiceSingleResponse } from '@pte-app/contracts';
import { ReadingMultipleChoiceSingleQuestionSchema, ReadingMultipleChoiceSingleResponseSchema } from '@pte-app/schemas';
import { READING_MANIFEST_BASE, validateReadingSubmission } from './common.js';

export function createReadingMultipleChoiceSingleHandler(): QuestionTypeHandler<
  ReadingMultipleChoiceSingleQuestion,
  ReadingMultipleChoiceSingleResponse
> {
  return {
    manifest: {
      ...READING_MANIFEST_BASE,
      type: 'reading_single_answer',
    },

    parseQuestion(input: unknown): ReadingMultipleChoiceSingleQuestion {
      return ReadingMultipleChoiceSingleQuestionSchema.parse(input);
    },

    parseResponse(input: unknown): ReadingMultipleChoiceSingleResponse {
      return ReadingMultipleChoiceSingleResponseSchema.parse(input);
    },

    createEmptyResponse(): ReadingMultipleChoiceSingleResponse {
      return { selectedKey: null };
    },

    getResponseState(response: ReadingMultipleChoiceSingleResponse): 'empty' | 'incomplete' | 'complete' | 'submitted' {
      if (response.selectedKey === null) return 'empty';
      return 'complete';
    },

    validateSubmission(
      input: SubmissionValidationInput<ReadingMultipleChoiceSingleResponse, ReadingMultipleChoiceSingleQuestion>,
    ): SubmissionValidationResult {
      const base = validateReadingSubmission(input, (r) => r.selectedKey === null);
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
