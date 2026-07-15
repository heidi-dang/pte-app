'use client';
import React from 'react';
interface Props {
  checks: Array<{ name: string; passed: boolean; message?: string }>;
  loading?: boolean;
}
export function ValidationResults({ checks, loading }: Props) {
  if (loading)
    return (
      <section aria-label="Validation">
        <p>Running validation...</p>
      </section>
    );
  return (
    <section aria-label="Validation">
      <h2>Validation Results</h2>
      {checks.length === 0 ? (
        <p>No validation checks run</p>
      ) : (
        <ul>
          {checks.map((c) => (
            <li key={c.name}>
              {c.name}: {c.passed ? 'Passed' : <span role="alert">Failed{c.message ? ` — ${c.message}` : ''}</span>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
