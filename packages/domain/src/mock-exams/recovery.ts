import type { MockSession } from '@pte-app/contracts';

/**
 * Recovery — restores session state after browser closure.
 * Uses server-authoritative clock to prevent browser clock manipulation.
 */
export interface MockRecoveryState {
  session: MockSession;
  remainingTimeMs: number;
  isExpired: boolean;
  canResume: boolean;
}

/**
 * Build recovery state using server-authoritative time.
 *
 * @param session - Server-returned authoritative session state
 * @param serverNowAtSnapshot - Server's clock at the moment it produced the session snapshot
 * @param clientReceivedAt - Client's local clock when it received the snapshot
 *
 * The browser clock cannot extend remaining time because:
 * - remaining is computed from serverDeadline minus serverNowAtSnapshot
 * - clientReceivedAt is only used to reconstruct "now" as serverNow + (clientNow - clientReceivedAt)
 * - if client clock is ahead, the reconstructed now is still server-authoritative
 * - if client clock is behind, remaining is still correct relative to server deadline
 */
export function buildRecoveryState(
  session: MockSession,
  serverNowAtSnapshot: string,
  clientReceivedAt: string,
): MockRecoveryState {
  const serverNowMs = new Date(serverNowAtSnapshot).getTime();
  const clientReceivedMs = new Date(clientReceivedAt).getTime();
  const clientNowMs = Date.now();

  const elapsedSinceSnapshotMs = clientNowMs - clientReceivedMs;
  const reconstructedServerNowMs = serverNowMs + elapsedSinceSnapshotMs;
  const deadlineMs = new Date(session.serverDeadline).getTime();

  const remaining = Math.max(0, deadlineMs - reconstructedServerNowMs);
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
