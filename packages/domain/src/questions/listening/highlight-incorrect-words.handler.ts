import type { QuestionTypeHandler, SubmissionValidationInput, SubmissionValidationResult } from '@pte-app/contracts';
import type { HighlightIncorrectWordsQuestion, HighlightIncorrectWordsResponse } from '@pte-app/contracts';
import { HighlightIncorrectWordsQuestionSchema, HighlightIncorrectWordsResponseSchema } from '@pte-app/schemas';
import { LISTENING_MANIFEST_BASE, validateListeningSubmission } from './common.js';

export function createHighlightIncorrectWordsHandler(): QuestionTypeHandler<
  HighlightIncorrectWordsQuestion,
  HighlightIncorrectWordsResponse
> {
  return {
    manifest: {
      ...LISTENING_MANIFEST_BASE,
      type: 'highlight_incorrect_words',
    },

    parseQuestion(input: unknown): HighlightIncorrectWordsQuestion {
      return HighlightIncorrectWordsQuestionSchema.parse(input);
    },

    parseResponse(input: unknown): HighlightIncorrectWordsResponse {
      return HighlightIncorrectWordsResponseSchema.parse(input);
    },

    createEmptyResponse(): HighlightIncorrectWordsResponse {
      return { flaggedWordIndices: [] };
    },

    getResponseState(response: HighlightIncorrectWordsResponse): 'empty' | 'incomplete' | 'complete' | 'submitted' {
      if (response.flaggedWordIndices.length === 0) return 'empty';
      return 'complete';
    },

    validateSubmission(input: SubmissionValidationInput<HighlightIncorrectWordsResponse>): SubmissionValidationResult {
      return validateListeningSubmission(input, (r) => r.flaggedWordIndices.length === 0);
    },
  };
}
