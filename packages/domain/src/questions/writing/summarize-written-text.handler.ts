import type { QuestionTypeHandler, SubmissionValidationInput, SubmissionValidationResult } from '@pte-app/contracts';
import type { SummarizeWrittenTextQuestion, SummarizeWrittenTextResponse } from '@pte-app/contracts';
import { SummarizeWrittenTextQuestionSchema, SummarizeWrittenTextResponseSchema } from '@pte-app/schemas';
import { countWords } from './word-count.js';

const WRITING_MANIFEST_BASE = {
  contractVersion: '1.0.0',
  questionSchemaVersion: '1.0.0',
  responseSchemaVersion: '1.0.0',
  capabilities: {
    supportsReview: true,
    supportsPlayback: false,
    supportsAutosave: true,
    supportsKeyboard: true,
    supportsTouchInteraction: true,
    supportsScreenReader: true,
    supportsReducedMotion: true,
  },
  accessibility: {
    keyboardOperable: true,
    screenReaderAnnouncements: true,
    visibleFocusStates: true,
    nonColourOnlyStatus: true,
    reducedMotionCompatible: true,
    touchCompatibleControls: true,
  },
} as const;

export function createSummarizeWrittenTextHandler(): QuestionTypeHandler<
  SummarizeWrittenTextQuestion,
  SummarizeWrittenTextResponse
> {
  return {
    manifest: { ...WRITING_MANIFEST_BASE, type: 'summarize_written_text' },

    parseQuestion(input: unknown): SummarizeWrittenTextQuestion {
      return SummarizeWrittenTextQuestionSchema.parse(input);
    },

    parseResponse(input: unknown): SummarizeWrittenTextResponse {
      return SummarizeWrittenTextResponseSchema.parse(input);
    },

    createEmptyResponse(): SummarizeWrittenTextResponse {
      return { text: '' };
    },

    getResponseState(response: SummarizeWrittenTextResponse): 'empty' | 'incomplete' | 'complete' | 'submitted' {
      if (response.text.length === 0) return 'empty';
      return 'incomplete';
    },

    validateSubmission(
      input: SubmissionValidationInput<SummarizeWrittenTextResponse, SummarizeWrittenTextQuestion>,
    ): SubmissionValidationResult {
      const { response, question, allowsEmptySubmission } = input;
      if (!allowsEmptySubmission && response.text.trim().length === 0) {
        return { valid: false, reason: 'Response is empty' };
      }
      const wordCount = countWords(response.text);
      if (wordCount > question.maxWords) {
        return { valid: false, reason: `Word count ${wordCount} exceeds maximum ${question.maxWords}` };
      }
      return { valid: true };
    },
  };
}
