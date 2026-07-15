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
      input: SubmissionValidationInput<ReadingMultipleChoiceMultipleResponse, ReadingMultipleChoiceMultipleQuestion>,
    ): SubmissionValidationResult {
      const base = validateReadingSubmission(input, (r) => r.selectedKeys.length === 0);
      if (!base.valid) return base;

      const { response, question } = input;

      const seen = new Set<string>();
      for (const key of response.selectedKeys) {
        if (seen.has(key)) {
          return { valid: false, reason: `Duplicate selected key: ${key}` };
        }
        seen.add(key);
      }

      if (question) {
        const validKeys = new Set(question.options.map((o) => o.key));
        for (const key of response.selectedKeys) {
          if (!validKeys.has(key)) {
            return { valid: false, reason: `Unknown selected key: ${key}` };
          }
        }
        if (response.selectedKeys.length > question.maxSelections) {
          return {
            valid: false,
            reason: `Too many selections: ${response.selectedKeys.length} > ${question.maxSelections}`,
          };
        }
      }

      return { valid: true };
    },
  };
}
