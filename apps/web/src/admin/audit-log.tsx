'use client';
import React from 'react';
interface Props {
  entries: Array<{ id: string; actionType: string; timestamp: string }>;
}
export function AuditLog({ entries }: Props) {
  return (
    <section aria-label="Audit log">
      <h2>Audit Log</h2>
      {entries.length === 0 ? (
        <p>No entries</p>
      ) : (
        <ul>
          {entries.map((e) => (
            <li key={e.id}>
              {e.actionType} at {e.timestamp}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
