'use client';
import React from 'react';
interface Props {
  matches: Array<{ matchedContentId: string; matchType: string; similarityScore: number; status: string }>;
  loading?: boolean;
  onResolve: (id: string, action: string) => void;
}
export function DuplicateResults({ matches, loading, onResolve }: Props) {
  if (loading)
    return (
      <section aria-label="Duplicate detection">
        <p>Scanning...</p>
      </section>
    );
  return (
    <section aria-label="Duplicate detection">
      <h2>Duplicate Results</h2>
      {matches.length === 0 ? (
        <p>No duplicates found</p>
      ) : (
        <ul>
          {matches.map((m) => (
            <li key={m.matchedContentId}>
              {m.matchType} ({m.similarityScore.toFixed(2)}) — {m.status}
              <button onClick={() => onResolve(m.matchedContentId, 'keep')}>Keep</button>
              <button onClick={() => onResolve(m.matchedContentId, 'reject')}>Reject</button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
