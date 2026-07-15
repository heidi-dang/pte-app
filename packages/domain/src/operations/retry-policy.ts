export function shouldRetry(attempt: number, maxRetries: number): boolean {
  return attempt < maxRetries;
}

export function nextRetryDelay(attempt: number, baseMs: number, maxMs: number): number {
  const delay = baseMs * Math.pow(2, attempt);
  return Math.min(delay, maxMs);
}
