import type { QuestionTypeHandler, SubmissionValidationInput, SubmissionValidationResult } from '@pte-app/contracts';
import type { RespondToSituationQuestion, RespondToSituationResponse } from '@pte-app/contracts';
import { RespondToSituationQuestionSchema, RespondToSituationResponseSchema } from '@pte-app/schemas';
import { SPEAKING_MANIFEST_BASE, validateRecordingSubmission } from './common.js';
import type { ValidatedRecordingContext } from './common.js';

export function createRespondToSituationHandler(): QuestionTypeHandler<
  RespondToSituationQuestion,
  RespondToSituationResponse
> {
  return {
    manifest: { ...SPEAKING_MANIFEST_BASE, type: 'respond_to_situation' },

    parseQuestion(input: unknown): RespondToSituationQuestion {
      return RespondToSituationQuestionSchema.parse(input);
    },

    parseResponse(input: unknown): RespondToSituationResponse {
      return RespondToSituationResponseSchema.parse(input);
    },

    createEmptyResponse(): RespondToSituationResponse {
      return { recordingId: '' };
    },

    getResponseState(response: RespondToSituationResponse): 'empty' | 'incomplete' | 'complete' | 'submitted' {
      if (!response.recordingId) return 'empty';
      return 'complete';
    },

    validateSubmission(
      input: SubmissionValidationInput<RespondToSituationResponse, RespondToSituationQuestion>,
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
