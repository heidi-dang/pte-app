import type { SessionState } from '@pte-app/contracts';
import { createEngineError, QuestionEngineError } from './errors.js';

export const VALID_TRANSITIONS: Record<SessionState, SessionState[]> = {
  created: ['active', 'abandoned', 'failed'],
  active: ['paused', 'submitting', 'expired', 'abandoned', 'failed'],
  paused: ['active', 'expired', 'abandoned', 'failed'],
  submitting: ['submitted', 'active', 'failed'],
  submitted: [],
  expired: [],
  abandoned: [],
  failed: [],
};

export function validateTransition(current: SessionState, next: SessionState): void {
  const allowed = VALID_TRANSITIONS[current] || [];
  if (!allowed.includes(next)) {
    throw createEngineError(
      'INVALID_SESSION_TRANSITION',
      `Cannot transition from session state '${current}' to '${next}'`
    );
  }
}
