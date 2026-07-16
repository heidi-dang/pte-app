import type { QuestionTypeHandler, SubmissionValidationInput, SubmissionValidationResult } from '@pte-app/contracts';
import type { DescribeImageQuestion, DescribeImageResponse } from '@pte-app/contracts';
import { DescribeImageQuestionSchema, DescribeImageResponseSchema } from '@pte-app/schemas';
import { SPEAKING_MANIFEST_BASE } from './common.js';

export function createDescribeImageHandler(): QuestionTypeHandler<DescribeImageQuestion, DescribeImageResponse> {
  return {
    manifest: { ...SPEAKING_MANIFEST_BASE, type: 'describe_image' },

    parseQuestion(input: unknown): DescribeImageQuestion {
      return DescribeImageQuestionSchema.parse(input);
    },

    parseResponse(input: unknown): DescribeImageResponse {
      return DescribeImageResponseSchema.parse(input);
    },

    createEmptyResponse(): DescribeImageResponse {
      return { recordingId: '' };
    },

    getResponseState(response: DescribeImageResponse): 'empty' | 'incomplete' | 'complete' | 'submitted' {
      if (!response.recordingId) return 'empty';
      return 'complete';
    },

    validateSubmission(
      input: SubmissionValidationInput<DescribeImageResponse, DescribeImageQuestion>,
    ): SubmissionValidationResult {
      const { response, allowsEmptySubmission } = input;
      if (!allowsEmptySubmission && !response.recordingId) {
        return { valid: false, reason: 'Recording is required' };
      }
      return { valid: true };
    },
  };
}
