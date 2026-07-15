'use client';
import React from 'react';
interface Props {
  assignments: Array<{ id: string; title: string; status: string }>;
  onCreate: () => void;
}
export function Assignments({ assignments, onCreate }: Props) {
  return (
    <section aria-label="Assignments">
      <h2>Assignments</h2>
      <button onClick={onCreate}>New Assignment</button>
      {assignments.length === 0 ? (
        <p>No assignments</p>
      ) : (
        <ul>
          {assignments.map((a) => (
            <li key={a.id}>
              {a.title} ({a.status})
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
