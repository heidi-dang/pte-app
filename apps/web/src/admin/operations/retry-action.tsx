'use client';
import React from 'react';
interface Props {
  originalJobId: string;
  failureReason: string;
  retryCount: number;
  onRetry: () => void;
  onCancel: () => void;
  processing?: boolean;
}
export function RetryAction({ originalJobId, failureReason, retryCount, onRetry, onCancel, processing }: Props) {
  return (
    <section aria-label="Retry operation">
      <h2>Retry Job</h2>
      <p>Job: {originalJobId}</p>
      <p>Failure: {failureReason}</p>
      <p>Retries: {retryCount}</p>
      <button onClick={onRetry} disabled={processing}>
        Retry
      </button>
      <button onClick={onCancel}>Cancel</button>
    </section>
  );
}
