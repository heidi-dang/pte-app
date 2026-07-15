import type { MockSession } from '@pte-app/contracts';

/**
 * Recovery — restores session state after browser closure.
 * Must restore exact selected questions, current section/task,
 * completed/incomplete/empty responses, consumed playback rights,
 * recording/upload state, and remaining time from server deadline.
 */
export interface MockRecoveryState {
  session: MockSession;
  remainingTimeMs: number;
  isExpired: boolean;
  canResume: boolean;
}

export function buildRecoveryState(session: MockSession): MockRecoveryState {
  const now = Date.now();
  const deadline = new Date(session.serverDeadline).getTime();
  const remaining = Math.max(0, deadline - now);
  const isExpired = remaining === 0;

  return {
    session,
    remainingTimeMs: remaining,
    isExpired,
    canResume:
      !isExpired &&
      session.state !== 'completed' &&
      session.state !== 'failed-terminal' &&
      session.state !== 'abandoned',
  };
}
