'use client';
import React from 'react';
interface Props {
  runbooks: Array<{
    id: string;
    version: number;
    environmentClass: string;
    approvalStatus: string;
    lastTestedAt?: string;
  }>;
  onSelect: (id: string) => void;
}
export function RestorationRunbooks({ runbooks, onSelect }: Props) {
  return (
    <section aria-label="Restoration runbooks">
      <h2>Restoration Runbooks</h2>
      {runbooks.length === 0 ? (
        <p>No runbooks</p>
      ) : (
        <ul>
          {runbooks.map((r) => (
            <li key={r.id}>
              v{r.version} ({r.environmentClass}) — {r.approvalStatus}{' '}
              <button onClick={() => onSelect(r.id)}>View</button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
