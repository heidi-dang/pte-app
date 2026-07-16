import type { QuestionTypeHandler, SubmissionValidationInput, SubmissionValidationResult } from '@pte-app/contracts';
import type { ListeningFillBlanksQuestion, ListeningFillBlanksResponse } from '@pte-app/contracts';
import { ListeningFillBlanksQuestionSchema, ListeningFillBlanksResponseSchema } from '@pte-app/schemas';
import { LISTENING_MANIFEST_BASE, validateListeningSubmission } from './common.js';

export function createListeningFillBlanksHandler(): QuestionTypeHandler<
  ListeningFillBlanksQuestion,
  ListeningFillBlanksResponse
> {
  return {
    manifest: {
      ...LISTENING_MANIFEST_BASE,
      type: 'listening_fill_blanks',
    },

    parseQuestion(input: unknown): ListeningFillBlanksQuestion {
      return ListeningFillBlanksQuestionSchema.parse(input);
    },

    parseResponse(input: unknown): ListeningFillBlanksResponse {
      return ListeningFillBlanksResponseSchema.parse(input);
    },

    createEmptyResponse(): ListeningFillBlanksResponse {
      return { placements: {} };
    },

    getResponseState(response: ListeningFillBlanksResponse): 'empty' | 'incomplete' | 'complete' | 'submitted' {
      const placements = Object.values(response.placements).filter((v) => v !== null && v !== undefined);
      if (placements.length === 0) return 'empty';
      return 'incomplete';
    },

    validateSubmission(
      input: SubmissionValidationInput<ListeningFillBlanksResponse, ListeningFillBlanksQuestion>,
    ): SubmissionValidationResult {
      const base = validateListeningSubmission(input, (r) =>
        Object.values(r.placements).every((v) => v === null || v === undefined),
      );
      if (!base.valid) return base;

      const { response, question } = input;
      const validGapIndices = new Set(question.gaps.map((g) => String(g.index)));
      for (const gapIndex of Object.keys(response.placements)) {
        if (!validGapIndices.has(gapIndex)) {
          return { valid: false, reason: `Unknown gap index: ${gapIndex}` };
        }
      }

      return { valid: true };
    },
  };
}
