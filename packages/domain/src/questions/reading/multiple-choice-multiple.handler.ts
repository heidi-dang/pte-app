import type { QuestionTypeHandler, SubmissionValidationInput, SubmissionValidationResult } from '@pte-app/contracts';
import type { ReadingMultipleChoiceMultipleQuestion, ReadingMultipleChoiceMultipleResponse } from '@pte-app/contracts';
import {
  ReadingMultipleChoiceMultipleQuestionSchema,
  ReadingMultipleChoiceMultipleResponseSchema,
} from '@pte-app/schemas';
import { READING_MANIFEST_BASE, validateReadingSubmission } from './common.js';

export interface McmScoringProfile {
  correctCredit: number;
  incorrectDeduction: number;
  minimumResult: number;
  maximumResult: number;
}

const DEFAULT_MCM_SCORING: McmScoringProfile = {
  correctCredit: 1,
  incorrectDeduction: 0.25,
  minimumResult: 0,
  maximumResult: 1,
};

export function getMcmScoringProfile(profileId?: string): McmScoringProfile {
  void profileId;
  return DEFAULT_MCM_SCORING;
}

export function createReadingMultipleChoiceMultipleHandler(): QuestionTypeHandler<
  ReadingMultipleChoiceMultipleQuestion,
  ReadingMultipleChoiceMultipleResponse
> {
  return {
    manifest: {
      ...READING_MANIFEST_BASE,
      type: 'reading_multiple_answers',
    },

    parseQuestion(input: unknown): ReadingMultipleChoiceMultipleQuestion {
      return ReadingMultipleChoiceMultipleQuestionSchema.parse(input);
    },

    parseResponse(input: unknown): ReadingMultipleChoiceMultipleResponse {
      return ReadingMultipleChoiceMultipleResponseSchema.parse(input);
    },

    createEmptyResponse(): ReadingMultipleChoiceMultipleResponse {
      return { selectedKeys: [] };
    },

    getResponseState(
      response: ReadingMultipleChoiceMultipleResponse,
    ): 'empty' | 'incomplete' | 'complete' | 'submitted' {
      if (response.selectedKeys.length === 0) return 'empty';
      return 'complete';
    },

    validateSubmission(
      input: SubmissionValidationInput<ReadingMultipleChoiceMultipleResponse>,
    ): SubmissionValidationResult {
      return validateReadingSubmission(input, (r) => r.selectedKeys.length === 0);
    },
  };
}
