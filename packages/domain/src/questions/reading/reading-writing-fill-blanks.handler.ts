import type { QuestionTypeHandler, SubmissionValidationInput, SubmissionValidationResult } from '@pte-app/contracts';
import type { ReadingWritingFillBlanksQuestion, ReadingWritingFillBlanksResponse } from '@pte-app/contracts';
import { ReadingWritingFillBlanksQuestionSchema, ReadingWritingFillBlanksResponseSchema } from '@pte-app/schemas';
import { READING_MANIFEST_BASE, validateReadingSubmission } from './common.js';

export function createReadingWritingFillBlanksHandler(): QuestionTypeHandler<
  ReadingWritingFillBlanksQuestion,
  ReadingWritingFillBlanksResponse
> {
  return {
    manifest: {
      ...READING_MANIFEST_BASE,
      type: 'reading_writing_fill_blanks',
    },

    parseQuestion(input: unknown): ReadingWritingFillBlanksQuestion {
      return ReadingWritingFillBlanksQuestionSchema.parse(input);
    },

    parseResponse(input: unknown): ReadingWritingFillBlanksResponse {
      return ReadingWritingFillBlanksResponseSchema.parse(input);
    },

    createEmptyResponse(): ReadingWritingFillBlanksResponse {
      return { selections: {} };
    },

    getResponseState(response: ReadingWritingFillBlanksResponse): 'empty' | 'incomplete' | 'complete' | 'submitted' {
      const keys = Object.keys(response.selections);
      if (keys.length === 0) return 'empty';
      return 'incomplete';
    },

    validateSubmission(
      input: SubmissionValidationInput<ReadingWritingFillBlanksResponse, ReadingWritingFillBlanksQuestion>,
    ): SubmissionValidationResult {
      const base = validateReadingSubmission(input, (r) => Object.keys(r.selections).length === 0);
      if (!base.valid) return base;

      const { response, question } = input;
      if (question) {
        for (const [gapIndex, selectedKey] of Object.entries(response.selections)) {
          const gap = question.gaps.find((g) => String(g.index) === gapIndex);
          if (!gap) {
            return { valid: false, reason: `Unknown gap index: ${gapIndex}` };
          }
          const validKeys = new Set(gap.options.map((o) => o.key));
          if (!validKeys.has(selectedKey)) {
            return { valid: false, reason: `Unknown option key '${selectedKey}' for gap ${gapIndex}` };
          }
        }
      }

      return { valid: true };
    },
  };
}
