'use client';
import React from 'react';
interface Props {
  overallDelta: number;
  regressions: string[];
  improvements: string[];
  inconclusive: boolean;
}
export function ProfileComparisonDisplay({ overallDelta, regressions, improvements, inconclusive }: Props) {
  return (
    <section aria-label="Profile comparison">
      <h2>Profile Comparison</h2>
      {inconclusive && <p role="alert">Inconclusive — insufficient data</p>}
      <p>
        Overall delta: {overallDelta > 0 ? '+' : ''}
        {overallDelta.toFixed(3)}
      </p>
      {regressions.length > 0 && (
        <div role="alert">
          <p>Regressions:</p>
          <ul>
            {regressions.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </div>
      )}
      {improvements.length > 0 && (
        <div>
          <p>Improvements:</p>
          <ul>
            {improvements.map((i) => (
              <li key={i}>{i}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
