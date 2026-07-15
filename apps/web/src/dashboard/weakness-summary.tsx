'use client';
import React from 'react';

interface WeaknessSummaryProps {
  weaknesses: Array<{ skillId: string; skillName: string; priority: string; reason: string }>;
  insufficientEvidence: boolean;
}

export function WeaknessSummary({ weaknesses, insufficientEvidence }: WeaknessSummaryProps) {
  return (
    <section aria-label="Weakness summary">
      <h2>Weaknesses</h2>
      {insufficientEvidence && <p role="alert">Insufficient evidence to assess all skills</p>}
      {weaknesses.length === 0 ? (
        <p>No weaknesses identified</p>
      ) : (
        <ul>
          {weaknesses.map((w) => (
            <li key={w.skillId}>
              {w.skillName} ({w.priority}): {w.reason}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
