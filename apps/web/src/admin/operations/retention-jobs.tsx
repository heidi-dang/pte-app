'use client';
import React from 'react';
interface Props {
  jobs: Array<{ id: string; targetDataClass: string; status: string; preview: boolean; dryRun: boolean }>;
  onCreatePreview: () => void;
  onExecute: (id: string) => void;
}
export function RetentionJobs({ jobs, onCreatePreview, onExecute }: Props) {
  return (
    <section aria-label="Retention jobs">
      <h2>Retention Jobs</h2>
      <button onClick={onCreatePreview}>Preview Retention</button>
      {jobs.length === 0 ? (
        <p>No retention jobs</p>
      ) : (
        <ul>
          {jobs.map((j) => (
            <li key={j.id}>
              {j.targetDataClass} — {j.status}
              {j.preview && ' (preview)'}
              {j.dryRun && ' (dry run)'}
              <button onClick={() => onExecute(j.id)} disabled={j.status !== 'preview'}>
                Execute
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
