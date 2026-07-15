import type {
  QuestionRendererManifest,
  SubmissionValidationInput,
  SubmissionValidationResult,
} from '@pte-app/contracts';

export const LISTENING_MANIFEST_BASE: Omit<QuestionRendererManifest, 'type'> = {
  contractVersion: '1.0.0',
  questionSchemaVersion: '1.0.0',
  responseSchemaVersion: '1.0.0',
  capabilities: {
    supportsReview: true,
    supportsPlayback: true,
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
};

export function validateListeningSubmission<TResponse, TQuestion = unknown>(
  input: SubmissionValidationInput<TResponse, TQuestion>,
  isEmpty: (r: TResponse) => boolean,
): SubmissionValidationResult {
  if (!input.allowsEmptySubmission && isEmpty(input.response)) {
    return { valid: false, reason: 'Response is empty and empty submission is not allowed' };
  }
  return { valid: true };
}
