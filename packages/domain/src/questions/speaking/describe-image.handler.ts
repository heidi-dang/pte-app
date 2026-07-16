import type { QuestionTypeHandler, SubmissionValidationInput, SubmissionValidationResult } from '@pte-app/contracts';
import type { DescribeImageQuestion, DescribeImageResponse } from '@pte-app/contracts';
import { DescribeImageQuestionSchema, DescribeImageResponseSchema } from '@pte-app/schemas';
import { SPEAKING_MANIFEST_BASE, validateRecordingSubmission } from './common.js';
import type { ValidatedRecordingContext } from './common.js';

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
      const ctx = input.recordingContext as ValidatedRecordingContext | undefined;
      if (ctx) {
        return validateRecordingSubmission(ctx, '', allowsEmptySubmission);
      }
      if (!allowsEmptySubmission && !response.recordingId) {
        return { valid: false, reason: 'Recording is required' };
      }
      return { valid: true };
    },
  };
}
