'use client';
import React from 'react';

interface TaskTypeMasteryProps {
  levels: Array<{ taskType: string; level: number; status: string; confidence: number; evidenceCount: number }>;
  insufficient?: boolean;
}

export function TaskTypeMastery({ levels, insufficient }: TaskTypeMasteryProps) {
  return (
    <section aria-label="Task-type mastery">
      <h2>Task-Type Mastery</h2>
      {insufficient && <p role="alert">Insufficient evidence for some task types</p>}
      {levels.length === 0 ? (
        <p>No task-type mastery data available</p>
      ) : (
        <ul>
          {levels.map((l) => (
            <li key={l.taskType}>
              {l.taskType}: Level {l.level >= 0 ? l.level : 'N/A'} ({l.status})
              {l.status === 'insufficient' && <span role="alert"> — insufficient evidence</span>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
