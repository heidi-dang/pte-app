import type { QuestionTypeHandler, SubmissionValidationInput, SubmissionValidationResult } from '@pte-app/contracts';
import type { SummarizeGroupDiscussionQuestion, SummarizeGroupDiscussionResponse } from '@pte-app/contracts';
import { SummarizeGroupDiscussionQuestionSchema, SummarizeGroupDiscussionResponseSchema } from '@pte-app/schemas';
import { SPEAKING_MANIFEST_BASE, validateRecordingSubmission } from './common.js';
import type { ValidatedRecordingContext } from './common.js';

export function createSummarizeGroupDiscussionHandler(): QuestionTypeHandler<
  SummarizeGroupDiscussionQuestion,
  SummarizeGroupDiscussionResponse
> {
  return {
    manifest: { ...SPEAKING_MANIFEST_BASE, type: 'summarize_group_discussion' },

    parseQuestion(input: unknown): SummarizeGroupDiscussionQuestion {
      return SummarizeGroupDiscussionQuestionSchema.parse(input);
    },

    parseResponse(input: unknown): SummarizeGroupDiscussionResponse {
      return SummarizeGroupDiscussionResponseSchema.parse(input);
    },

    createEmptyResponse(): SummarizeGroupDiscussionResponse {
      return { recordingId: '' };
    },

    getResponseState(response: SummarizeGroupDiscussionResponse): 'empty' | 'incomplete' | 'complete' | 'submitted' {
      if (!response.recordingId) return 'empty';
      if (response.writtenSummary === undefined || response.writtenSummary.trim().length === 0) {
        return 'incomplete';
      }
      return 'complete';
    },

    validateSubmission(
      input: SubmissionValidationInput<SummarizeGroupDiscussionResponse, SummarizeGroupDiscussionQuestion>,
    ): SubmissionValidationResult {
      const { response, question, allowsEmptySubmission } = input;
      const ctx = input.recordingContext as ValidatedRecordingContext | undefined;
      if (ctx) {
        const recordingResult = validateRecordingSubmission(ctx, '', allowsEmptySubmission);
        if (!recordingResult.valid) return recordingResult;
      } else {
        if (!allowsEmptySubmission && !response.recordingId) {
          return { valid: false, reason: 'Recording is required' };
        }
        if (response.recordingId && response.recordingId.trim().length === 0) {
          return { valid: false, reason: 'Recording ID must not be whitespace-only' };
        }
      }

      if (response.writtenSummary !== undefined && response.writtenSummary.trim().length > 0) {
        const words = response.writtenSummary.trim().split(/\s+/).filter(Boolean);
        const wordCount = words.length;
        if (wordCount > question.maxWords) {
          return { valid: false, reason: `Word count ${wordCount} exceeds maximum ${question.maxWords}` };
        }
        if (wordCount < question.minWords) {
          return { valid: false, reason: `Word count ${wordCount} is below minimum ${question.minWords}` };
        }
      } else if (response.writtenSummary !== undefined && response.writtenSummary.trim().length === 0) {
        return { valid: false, reason: 'Written summary must not be whitespace-only' };
      }
      return { valid: true };
    },
  };
}
