'use client';
import React from 'react';
interface Props {
  jobs: Array<{ id: string; status: string }>;
  onRetry: (id: string) => void;
  onCancel: (id: string) => void;
}
export function ScoringJobs({ jobs, onRetry, onCancel }: Props) {
  return (
    <section aria-label="Scoring jobs">
      <h2>Scoring Jobs</h2>
      {jobs.length === 0 ? (
        <p>No jobs</p>
      ) : (
        <ul>
          {jobs.map((j) => (
            <li key={j.id}>
              {j.status} <button onClick={() => onRetry(j.id)}>Retry</button>
              <button onClick={() => onCancel(j.id)}>Cancel</button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
