import type { QuestionTypeHandler, SubmissionValidationInput, SubmissionValidationResult } from '@pte-app/contracts';
import type { RetellLectureQuestion, RetellLectureResponse } from '@pte-app/contracts';
import { RetellLectureQuestionSchema, RetellLectureResponseSchema } from '@pte-app/schemas';
import { SPEAKING_MANIFEST_BASE, validateRecordingSubmission } from './common.js';
import type { ValidatedRecordingContext } from './common.js';

export function createRetellLectureHandler(): QuestionTypeHandler<RetellLectureQuestion, RetellLectureResponse> {
  return {
    manifest: { ...SPEAKING_MANIFEST_BASE, type: 'retell_lecture' },

    parseQuestion(input: unknown): RetellLectureQuestion {
      return RetellLectureQuestionSchema.parse(input);
    },

    parseResponse(input: unknown): RetellLectureResponse {
      return RetellLectureResponseSchema.parse(input);
    },

    createEmptyResponse(): RetellLectureResponse {
      return { recordingId: '' };
    },

    getResponseState(response: RetellLectureResponse): 'empty' | 'incomplete' | 'complete' | 'submitted' {
      if (!response.recordingId) return 'empty';
      return 'complete';
    },

    validateSubmission(
      input: SubmissionValidationInput<RetellLectureResponse, RetellLectureQuestion>,
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
