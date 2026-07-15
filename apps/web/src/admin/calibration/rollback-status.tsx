'use client';
import React from 'react';
interface Props {
  rollbacks: Array<{
    id: string;
    candidateVersion: number;
    originalVersion: number;
    reason: string;
    decidedAt: string;
  }>;
}
export function RollbackStatus({ rollbacks }: Props) {
  return (
    <section aria-label="Rollback history">
      <h2>Rollback Status</h2>
      {rollbacks.length === 0 ? (
        <p>No rollbacks recorded</p>
      ) : (
        <ul>
          {rollbacks.map((r) => (
            <li key={r.id}>
              v{r.candidateVersion} → v{r.originalVersion}: {r.reason} at <time>{r.decidedAt}</time>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
