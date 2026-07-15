'use client';
import React from 'react';
interface Props {
  jobs: Array<{ id: string; status: string }>;
  onRetry: (id: string) => void;
}
export function FailedJobs({ jobs, onRetry }: Props) {
  return (
    <section aria-label="Failed jobs">
      <h2>Failed Jobs</h2>
      {jobs.length === 0 ? (
        <p>No failed jobs</p>
      ) : (
        <ul>
          {jobs.map((j) => (
            <li key={j.id}>
              {j.id} <button onClick={() => onRetry(j.id)}>Retry</button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
