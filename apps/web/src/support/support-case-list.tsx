'use client';
import React from 'react';
interface Props {
  cases: Array<{ id: string; subject: string; status: string }>;
  onSelect: (id: string) => void;
}
export function SupportCaseList({ cases, onSelect }: Props) {
  return (
    <section aria-label="Support cases">
      <h2>Cases</h2>
      {cases.length === 0 ? (
        <p>No cases</p>
      ) : (
        <ul>
          {cases.map((c) => (
            <li key={c.id}>
              <button onClick={() => onSelect(c.id)}>
                {c.subject} ({c.status})
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
