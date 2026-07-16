// packages/contracts/src/question-engine/session-mode.ts

export const QUESTION_SESSION_MODES = ['learning', 'review', 'timed-practice', 'section-test', 'mock'] as const;

export type QuestionSessionMode = (typeof QUESTION_SESSION_MODES)[number];

export interface SessionModeCapabilities {
  canPause: boolean;
  showsFeedback: boolean;
  showsCorrectAnswer: boolean;
  usesServerDeadline: boolean;
  allowsReview: boolean;
  allowsPlayback: boolean;
  allowsAutosave: boolean;
  allowsEmptySubmission: boolean;
}

/**
 * Development/test fixture only. NOT the production source of truth.
 * Production logic resolves QuestionSessionModeProfile instances attached to sessions.
 */
export const DEV_MODE_CAPABILITIES_FIXTURE: Record<QuestionSessionMode, SessionModeCapabilities> = {
  learning: {
    canPause: true,
    showsFeedback: true,
    showsCorrectAnswer: false,
    usesServerDeadline: false,
    allowsReview: true,
    allowsPlayback: true,
    allowsAutosave: true,
    allowsEmptySubmission: false,
  },
  review: {
    canPause: false,
    showsFeedback: true,
    showsCorrectAnswer: true,
    usesServerDeadline: false,
    allowsReview: true,
    allowsPlayback: true,
    allowsAutosave: false,
    allowsEmptySubmission: false,
  },
  'timed-practice': {
    canPause: false,
    showsFeedback: true,
    showsCorrectAnswer: false,
    usesServerDeadline: true,
    allowsReview: false,
    allowsPlayback: false,
    allowsAutosave: true,
    allowsEmptySubmission: false,
  },
  'section-test': {
    canPause: false,
    showsFeedback: false,
    showsCorrectAnswer: false,
    usesServerDeadline: true,
    allowsReview: false,
    allowsPlayback: false,
    allowsAutosave: true,
    allowsEmptySubmission: false,
  },
  mock: {
    canPause: false,
    showsFeedback: false,
    showsCorrectAnswer: false,
    usesServerDeadline: false,
    allowsReview: true,
    allowsPlayback: true,
    allowsAutosave: true,
    allowsEmptySubmission: true,
  },
};
