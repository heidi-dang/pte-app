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
      if (response.summary.length === 0) return 'empty';
      return 'complete';
    },

    validateSubmission(
      input: SubmissionValidationInput<SummariseSpokenTextResponse, SummariseSpokenTextQuestion>,
    ): SubmissionValidationResult {
      const base = validateListeningSubmission(input, (r) => r.summary.length === 0);
      if (!base.valid) return base;

      const { response, question } = input;
      const wordCount = response.summary.trim().split(/\s+/).filter(Boolean).length;

      if (wordCount > question.maxWords) {
        return { valid: false, reason: `Word count ${wordCount} exceeds maximum ${question.maxWords}` };
      }

      return { valid: true };
    },
  };
}
