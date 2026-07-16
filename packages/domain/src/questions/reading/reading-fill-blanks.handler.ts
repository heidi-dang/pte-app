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

    validateSubmission(
      input: SubmissionValidationInput<ReadingFillBlanksResponse, ReadingFillBlanksQuestion>,
    ): SubmissionValidationResult {
      const base = validateReadingSubmission(input, (r) =>
        Object.values(r.placements).every((v) => v === null || v === undefined),
      );
      if (!base.valid) return base;

      const { response, question } = input;
      const validGapCount = question.gaps.length;
      const validTokenIds = new Set(question.tokens.map((t) => t.id));
      const usedTokens = new Set<string>();

      for (const [gapIdx, tokenId] of Object.entries(response.placements)) {
        const idx = parseInt(gapIdx, 10);
        if (isNaN(idx) || idx < 0 || idx >= validGapCount) {
          return { valid: false, reason: `Invalid gap index: ${gapIdx}` };
        }
        if (tokenId === null || tokenId === undefined) continue;
        if (!validTokenIds.has(tokenId)) {
          return { valid: false, reason: `Unknown token ID: ${tokenId}` };
        }
        if (usedTokens.has(tokenId)) {
          return { valid: false, reason: `Duplicate token placement: ${tokenId}` };
        }
        usedTokens.add(tokenId);
      }

      return { valid: true };
    },
  };
}
