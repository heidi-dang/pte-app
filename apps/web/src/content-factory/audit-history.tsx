'use client';
import React from 'react';
interface Props {
  entries: Array<{ action: string; actorId: string; timestamp: string }>;
  loading?: boolean;
}
export function ContentAuditHistory({ entries, loading }: Props) {
  if (loading)
    return (
      <section aria-label="Audit history">
        <p>Loading...</p>
      </section>
    );
  return (
    <section aria-label="Audit history">
      <h2>Audit History</h2>
      {entries.length === 0 ? (
        <p>No audit records</p>
      ) : (
        <ul>
          {entries.map((e, i) => (
            <li key={i}>
              {e.action} by {e.actorId} at <time>{e.timestamp}</time>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
