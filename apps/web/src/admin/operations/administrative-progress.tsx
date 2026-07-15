'use client';
import React from 'react';
interface Props {
  progress: Array<{
    id: string;
    jobType: string;
    percentage: number;
    currentStage: string;
    stale: boolean;
    completedItems: number;
    failedItems: number;
    totalItems: number;
  }>;
}
export function AdministrativeProgress({ progress }: Props) {
  return (
    <section aria-label="Administrative progress">
      <h2>Administrative Progress</h2>
      {progress.length === 0 ? (
        <p>No active operations</p>
      ) : (
        <ul>
          {progress.map((p) => (
            <li key={p.id}>
              {p.jobType}: {p.currentStage} ({p.percentage}%){p.stale && <span role="alert"> — stale</span>}
              <progress value={p.percentage} max={100} aria-label={`${p.percentage}%`} />
              <p>
                Items: {p.completedItems}/{p.totalItems} (failures: {p.failedItems})
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
