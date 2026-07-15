'use client';
import React from 'react';
interface Props {
  responseId: string;
  originalPreserved: boolean;
  action: string;
  onRecover: (action: string) => void;
  processing?: boolean;
}
export function ScoringRecovery({ responseId, originalPreserved, action, onRecover, processing }: Props) {
  return (
    <section aria-label="Scoring recovery">
      <h2>Scoring Recovery</h2>
      <p>Response: {responseId}</p>
      <p>Original preserved: {originalPreserved ? 'Yes' : 'No'}</p>
      <p>Current action: {action}</p>
      <button onClick={() => onRecover('retry-same-profile')} disabled={processing || !originalPreserved}>
        Retry (same profile)
      </button>
      <button onClick={() => onRecover('retry-new-profile')} disabled={processing || !originalPreserved}>
        Retry (new profile)
      </button>
      <button onClick={() => onRecover('manual-review')} disabled={processing}>
        Manual Review
      </button>
    </section>
  );
}
