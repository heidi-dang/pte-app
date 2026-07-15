'use client';
import React from 'react';
interface Props {
  reviewers: Array<{ id: string; name: string; workload: number }>;
  onAssign: (reviewerId: string) => void;
  loading?: boolean;
}
export function ReviewerAssignment({ reviewers, onAssign, loading }: Props) {
  if (loading)
    return (
      <section aria-label="Reviewer assignment">
        <p>Loading...</p>
      </section>
    );
  return (
    <section aria-label="Reviewer assignment">
      <h2>Assign Reviewer</h2>
      {reviewers.length === 0 ? (
        <p>No available reviewers</p>
      ) : (
        <ul>
          {reviewers.map((r) => (
            <li key={r.id}>
              {r.name} (workload: {r.workload}){' '}
              <button onClick={() => onAssign(r.id)} disabled={r.workload >= 5}>
                Assign
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
