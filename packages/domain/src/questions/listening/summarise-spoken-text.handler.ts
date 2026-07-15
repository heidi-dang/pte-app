import type { QuestionTypeHandler, SubmissionValidationInput, SubmissionValidationResult } from '@pte-app/contracts';
import type { SummariseSpokenTextQuestion, SummariseSpokenTextResponse } from '@pte-app/contracts';
import { SummariseSpokenTextQuestionSchema, SummariseSpokenTextResponseSchema } from '@pte-app/schemas';
import { LISTENING_MANIFEST_BASE, validateListeningSubmission } from './common.js';

export function createSummariseSpokenTextHandler(): QuestionTypeHandler<
  SummariseSpokenTextQuestion,
  SummariseSpokenTextResponse
> {
  return {
    manifest: {
      ...LISTENING_MANIFEST_BASE,
      type: 'summarise_spoken_text',
    },

    parseQuestion(input: unknown): SummariseSpokenTextQuestion {
      return SummariseSpokenTextQuestionSchema.parse(input);
    },

    parseResponse(input: unknown): SummariseSpokenTextResponse {
      return SummariseSpokenTextResponseSchema.parse(input);
    },

    createEmptyResponse(): SummariseSpokenTextResponse {
      return { summary: '', wordCount: 0 };
    },

    getResponseState(response: SummariseSpokenTextResponse): 'empty' | 'incomplete' | 'complete' | 'submitted' {
      if (response.summary.trim().length === 0) return 'empty';
      return 'incomplete';
    },

    validateSubmission(input: SubmissionValidationInput<SummariseSpokenTextResponse>): SubmissionValidationResult {
      return validateListeningSubmission(input, (r) => r.summary.trim().length === 0);
    },
  };
}
