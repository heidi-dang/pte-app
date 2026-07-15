import type { QuestionTypeHandler, SubmissionValidationInput, SubmissionValidationResult } from '@pte-app/contracts';
import type { ReorderParagraphQuestion, ReorderParagraphResponse } from '@pte-app/contracts';
import { ReorderParagraphQuestionSchema, ReorderParagraphResponseSchema } from '@pte-app/schemas';
import { READING_MANIFEST_BASE } from './common.js';

export function createReorderParagraphHandler(): QuestionTypeHandler<
  ReorderParagraphQuestion,
  ReorderParagraphResponse
> {
  return {
    manifest: {
      ...READING_MANIFEST_BASE,
      type: 'reorder_paragraph',
    },

    parseQuestion(input: unknown): ReorderParagraphQuestion {
      return ReorderParagraphQuestionSchema.parse(input);
    },

    parseResponse(input: unknown): ReorderParagraphResponse {
      return ReorderParagraphResponseSchema.parse(input);
    },

    createEmptyResponse(): ReorderParagraphResponse {
      return { orderedIds: [] };
    },

    getResponseState(response: ReorderParagraphResponse): 'empty' | 'incomplete' | 'complete' | 'submitted' {
      if (response.orderedIds.length === 0) return 'empty';
      return 'incomplete';
    },

    validateSubmission(input: SubmissionValidationInput<ReorderParagraphResponse>): SubmissionValidationResult {
      const { response, allowsEmptySubmission } = input;
      if (!allowsEmptySubmission && response.orderedIds.length === 0) {
        return { valid: false, reason: 'Response is empty and empty submission is not allowed' };
      }

      const seen = new Set<string>();
      for (const id of response.orderedIds) {
        if (seen.has(id)) {
          return { valid: false, reason: `Duplicate paragraph ID: ${id}` };
        }
        seen.add(id);
      }

      return { valid: true };
    },
  };
}
