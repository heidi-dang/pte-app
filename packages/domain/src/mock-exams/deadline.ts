/**
 * Deadline management — absolute server-owned deadlines.
 * Browser closure does not pause the deadline.
 */
export function isDeadlineExpired(serverDeadline: string): boolean {
  return new Date(serverDeadline).getTime() < Date.now();
}

export function remainingTimeMs(serverDeadline: string): number {
  return Math.max(0, new Date(serverDeadline).getTime() - Date.now());
}

export function createServerDeadline(startedAt: string, durationMs: number): string {
  return new Date(new Date(startedAt).getTime() + durationMs).toISOString();
}
