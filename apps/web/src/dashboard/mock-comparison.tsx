'use client';
import React from 'react';

interface MockComparisonProps {
  entries: Array<{
    mockSessionId: string;
    completedAt: string;
    estimatedResult: number;
    compatible: boolean;
    incompatibilityReason?: string;
  }>;
  warnings: string[];
}

export function MockComparison({ entries, warnings }: MockComparisonProps) {
  return (
    <section aria-label="Mock comparison">
      <h2>Mock Comparison</h2>
      {warnings.map((w, i) => (
        <p key={i} role="alert">
          {w}
        </p>
      ))}
      {entries.length === 0 ? (
        <p>No mock results to compare</p>
      ) : (
        <ul>
          {entries.map((e) => (
            <li key={e.mockSessionId}>
              Mock {e.mockSessionId} — Estimated training result: {e.estimatedResult.toFixed(2)}
              {!e.compatible && <span role="alert"> (incompatible: {e.incompatibilityReason})</span>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
