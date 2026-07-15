import type { QuestionTypeHandler, SubmissionValidationInput, SubmissionValidationResult } from '@pte-app/contracts';
import type { ReadingFillBlanksQuestion, ReadingFillBlanksResponse } from '@pte-app/contracts';
import { ReadingFillBlanksQuestionSchema, ReadingFillBlanksResponseSchema } from '@pte-app/schemas';
import { READING_MANIFEST_BASE, validateReadingSubmission } from './common.js';

export function createReadingFillBlanksHandler(): QuestionTypeHandler<
  ReadingFillBlanksQuestion,
  ReadingFillBlanksResponse
> {
  return {
    manifest: {
      ...READING_MANIFEST_BASE,
      type: 'reading_fill_blanks',
    },

    parseQuestion(input: unknown): ReadingFillBlanksQuestion {
      return ReadingFillBlanksQuestionSchema.parse(input);
    },

    parseResponse(input: unknown): ReadingFillBlanksResponse {
      return ReadingFillBlanksResponseSchema.parse(input);
    },

    createEmptyResponse(): ReadingFillBlanksResponse {
      return { placements: {} };
    },

    getResponseState(response: ReadingFillBlanksResponse): 'empty' | 'incomplete' | 'complete' | 'submitted' {
      const placements = Object.values(response.placements).filter((v) => v !== null && v !== undefined);
      if (placements.length === 0) return 'empty';
      return 'incomplete';
    },

    validateSubmission(input: SubmissionValidationInput<ReadingFillBlanksResponse>): SubmissionValidationResult {
      return validateReadingSubmission(input, (r) =>
        Object.values(r.placements).every((v) => v === null || v === undefined),
      );
    },
  };
}
