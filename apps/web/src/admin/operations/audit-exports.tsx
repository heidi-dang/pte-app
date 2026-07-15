'use client';
import React from 'react';
interface Props {
  jobs: Array<{ id: string; status: string; progress: number }>;
  onRequestExport: () => void;
  onDownload: (id: string) => void;
}
export function AuditExports({ jobs, onRequestExport, onDownload }: Props) {
  return (
    <section aria-label="Audit exports">
      <h2>Audit Exports</h2>
      <button onClick={onRequestExport}>Request Export</button>
      {jobs.length === 0 ? (
        <p>No export jobs</p>
      ) : (
        <ul>
          {jobs.map((j) => (
            <li key={j.id}>
              {j.status} ({j.progress}%)
              {j.status === 'completed' && <button onClick={() => onDownload(j.id)}>Download</button>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
