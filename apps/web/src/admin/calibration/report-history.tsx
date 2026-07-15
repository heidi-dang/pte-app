'use client';
import React from 'react';
interface Props {
  reports: Array<{ id: string; version: number; immutable: boolean; createdAt: string }>;
  onSelect: (id: string) => void;
}
export function CalibrationReportHistory({ reports, onSelect }: Props) {
  return (
    <section aria-label="Calibration reports">
      <h2>Report History</h2>
      {reports.length === 0 ? (
        <p>No calibration reports</p>
      ) : (
        <ul>
          {reports.map((r) => (
            <li key={r.id}>
              v{r.version} ({r.immutable ? 'Final' : 'Draft'}) at <time>{r.createdAt}</time>{' '}
              <button onClick={() => onSelect(r.id)}>View</button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
