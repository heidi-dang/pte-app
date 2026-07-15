import type { QuestionTypeHandler, SubmissionValidationInput, SubmissionValidationResult } from '@pte-app/contracts';
import type { SummarizeGroupDiscussionQuestion, SummarizeGroupDiscussionResponse } from '@pte-app/contracts';
import { SummarizeGroupDiscussionQuestionSchema, SummarizeGroupDiscussionResponseSchema } from '@pte-app/schemas';
import { SPEAKING_MANIFEST_BASE } from './common.js';

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
      if (response.writtenSummary !== undefined && response.writtenSummary.length === 0) return 'incomplete';
      return 'complete';
    },

    validateSubmission(
      input: SubmissionValidationInput<SummarizeGroupDiscussionResponse, SummarizeGroupDiscussionQuestion>,
    ): SubmissionValidationResult {
      const { response, question, allowsEmptySubmission } = input;
      if (!allowsEmptySubmission && !response.recordingId) {
        return { valid: false, reason: 'Recording is required' };
      }
      if (response.writtenSummary !== undefined) {
        const wordCount = response.writtenSummary.trim().split(/\s+/).filter(Boolean).length;
        if (wordCount > question.maxWords) {
          return { valid: false, reason: `Word count ${wordCount} exceeds maximum ${question.maxWords}` };
        }
      }
      return { valid: true };
    },
  };
}
