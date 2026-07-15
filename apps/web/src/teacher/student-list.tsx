'use client';
import React from 'react';
interface Props {
  students: Array<{ id: string; name: string }>;
  onSelect: (id: string) => void;
  loading?: boolean;
}
export function StudentList({ students, onSelect, loading }: Props) {
  if (loading)
    return (
      <section aria-label="Students">
        <p>Loading...</p>
      </section>
    );
  return (
    <section aria-label="Students">
      <h2>Students</h2>
      {students.length === 0 ? (
        <p>No students assigned</p>
      ) : (
        <ul>
          {students.map((s) => (
            <li key={s.id}>
              <button onClick={() => onSelect(s.id)}>{s.name}</button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
