/**
 * Retry policy for evaluation providers.
 */
export interface RetryPolicy {
  maxRetries: number;
  backoffMs: number;
  maxBackoffMs: number;
}

export interface RetryState {
  attempt: number;
  lastError?: string;
  nextRetryAt?: string;
  state: 'idle' | 'retrying' | 'exhausted';
}

export function shouldRetry(policy: RetryPolicy, state: RetryState): boolean {
  return state.state === 'idle' || (state.state === 'retrying' && state.attempt < policy.maxRetries);
}

export function nextRetryDelay(policy: RetryPolicy, attempt: number): number {
  const delay = policy.backoffMs * Math.pow(2, attempt);
  return Math.min(delay, policy.maxBackoffMs);
}
