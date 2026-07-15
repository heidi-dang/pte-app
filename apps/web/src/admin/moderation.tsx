'use client';
import React from 'react';
interface Props {
  cases: Array<{ id: string; status: string }>;
  onAssign: (id: string) => void;
}
export function Moderation({ cases, onAssign }: Props) {
  return (
    <section aria-label="Moderation">
      <h2>Moderation Cases</h2>
      {cases.length === 0 ? (
        <p>No cases</p>
      ) : (
        <ul>
          {cases.map((c) => (
            <li key={c.id}>
              {c.id} ({c.status}) <button onClick={() => onAssign(c.id)}>Assign</button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
