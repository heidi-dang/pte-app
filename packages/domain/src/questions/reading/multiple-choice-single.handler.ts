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
      input: SubmissionValidationInput<ReadingMultipleChoiceSingleResponse>,
    ): SubmissionValidationResult {
      return validateReadingSubmission(input, (r) => r.selectedKey === null);
    },
  };
}
