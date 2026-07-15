import type { QuestionTypeHandler, SubmissionValidationInput, SubmissionValidationResult } from '@pte-app/contracts';
import type { WriteFromDictationQuestion, WriteFromDictationResponse } from '@pte-app/contracts';
import { WriteFromDictationQuestionSchema, WriteFromDictationResponseSchema } from '@pte-app/schemas';
import { LISTENING_MANIFEST_BASE, validateListeningSubmission } from './common.js';

export function createWriteFromDictationHandler(): QuestionTypeHandler<
  WriteFromDictationQuestion,
  WriteFromDictationResponse
> {
  return {
    manifest: {
      ...LISTENING_MANIFEST_BASE,
      type: 'write_from_dictation',
    },

    parseQuestion(input: unknown): WriteFromDictationQuestion {
      return WriteFromDictationQuestionSchema.parse(input);
    },

    parseResponse(input: unknown): WriteFromDictationResponse {
      return WriteFromDictationResponseSchema.parse(input);
    },

    createEmptyResponse(): WriteFromDictationResponse {
      return { words: '' };
    },

    getResponseState(response: WriteFromDictationResponse): 'empty' | 'incomplete' | 'complete' | 'submitted' {
      if (response.words.trim().length === 0) return 'empty';
      return 'complete';
    },

    validateSubmission(
      input: SubmissionValidationInput<WriteFromDictationResponse, WriteFromDictationQuestion>,
    ): SubmissionValidationResult {
      return validateListeningSubmission(input, (r) => r.words.trim().length === 0);
    },
  };
}
