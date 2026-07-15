/**
 * Deadline management — absolute server-owned deadlines.
 * Browser closure does not pause the deadline.
 *
 * All remaining-time calculations use server-authoritative clock.
 */
export function isDeadlineExpired(serverDeadline: string, serverNow?: string): boolean {
  const now = serverNow ? new Date(serverNow).getTime() : Date.now();
  return new Date(serverDeadline).getTime() < now;
}

export function remainingTimeMs(serverDeadline: string, serverNow?: string): number {
  const now = serverNow ? new Date(serverNow).getTime() : Date.now();
  return Math.max(0, new Date(serverDeadline).getTime() - now);
}

export function createServerDeadline(startedAt: string, durationMs: number): string {
  return new Date(new Date(startedAt).getTime() + durationMs).toISOString();
}

/**
 * Compute remaining time on client using server-authoritative snapshot.
 * Browser clock cannot extend remaining time.
 */
export function remainingTimeClient(
  serverDeadline: string,
  serverNowAtSnapshot: string,
  clientReceivedAt: string,
): number {
  const serverNowMs = new Date(serverNowAtSnapshot).getTime();
  const clientReceivedMs = new Date(clientReceivedAt).getTime();
  const clientNowMs = Date.now();

  const elapsedSinceSnapshotMs = clientNowMs - clientReceivedMs;
  const reconstructedServerNowMs = serverNowMs + elapsedSinceSnapshotMs;
  const deadlineMs = new Date(serverDeadline).getTime();

  return Math.max(0, deadlineMs - reconstructedServerNowMs);
}
