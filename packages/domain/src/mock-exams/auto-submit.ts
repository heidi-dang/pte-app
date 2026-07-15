import type { MockSession } from '@pte-app/contracts';

/**
 * Auto-submit — idempotent.
 * Duplicate submit or expiry events must not create duplicate scoring jobs.
 */
export function shouldAutoSubmit(session: MockSession): boolean {
  if (session.submissionState.submitted) return false;
  if (session.state !== 'active' && session.state !== 'section-transition') return false;
  return true;
}

export function canSubmit(session: MockSession, idempotencyKey: string): { allowed: boolean; reason?: string } {
  if (session.submissionState.submitted) {
    if (session.submissionState.idempotencyKey === idempotencyKey) {
      return { allowed: true, reason: 'idempotent-duplicate' };
    }
    return { allowed: false, reason: 'already-submitted' };
  }
  if (session.state === 'completed' || session.state === 'expired') {
    return { allowed: false, reason: 'session-terminal' };
  }
  return { allowed: true };
}
