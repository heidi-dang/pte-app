import type { QuestionVersionId } from './identifiers.js';

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

export interface ScoringProfileSummary {
  id: string;
  version: number;
  correctCredit: number;
  incorrectDeduction: number;
  minimumResult: number;
  maximumResult: number;
}

export interface ModeProfileSummary {
  id: string;
  version: number;
  mode: string;
}

/**
 * Immutable submission context. All fields except response and sessionMode
 * are mandatory — no handler accepts missing question context, and no
 * service call can omit questionVersionId.
 */
export interface SubmissionValidationInput<TResponse = unknown, TQuestion = unknown> {
  response: TResponse;
  sessionMode: string;
  allowsEmptySubmission: boolean;
  /** The parsed question for immutable-context validation. */
  question: TQuestion;
  /** The question version ID the session was started against. Must be the branded type. */
  questionVersionId: QuestionVersionId;
  /** The resolved mode profile attached to this session. */
  modeProfile: ModeProfileSummary;
  /** The resolved scoring profile attached to this session, or null if not yet scored. */
  scoringProfile: ScoringProfileSummary | null;
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
  validateSubmission(input: SubmissionValidationInput<TResponse, TQuestion>): SubmissionValidationResult;
}
