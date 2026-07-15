export interface QuestionRendererCapabilities {
  supportsReview: boolean;
  supportsPlayback: boolean;
  supportsAutosave: boolean;
  supportsKeyboard: boolean;
  supportsTouchInteraction: boolean;
  supportsScreenReader: boolean;
  supportsReducedMotion: boolean;
}

export interface RendererAccessibilityContract {
  keyboardOperable: boolean;
  screenReaderAnnouncements: boolean;
  visibleFocusStates: boolean;
  nonColourOnlyStatus: boolean;
  reducedMotionCompatible: boolean;
  touchCompatibleControls: boolean;
}

export interface QuestionRendererManifest {
  type: string;
  contractVersion: string;
  questionSchemaVersion: string;
  responseSchemaVersion: string;
  capabilities: QuestionRendererCapabilities;
  accessibility: RendererAccessibilityContract;
}

export interface SubmissionValidationInput<TResponse = unknown> {
  response: TResponse;
  sessionMode: string;
  allowsEmptySubmission: boolean;
}

export interface SubmissionValidationResult {
  valid: boolean;
  reason?: string;
}

export interface QuestionTypeHandler<TQuestion = unknown, TResponse = unknown> {
  manifest: QuestionRendererManifest;
  parseQuestion(input: unknown): TQuestion;
  parseResponse(input: unknown): TResponse;
  createEmptyResponse(): TResponse;
  getResponseState(response: TResponse): 'empty' | 'incomplete' | 'complete' | 'submitted';
  validateSubmission(input: SubmissionValidationInput<TResponse>): SubmissionValidationResult;
}
