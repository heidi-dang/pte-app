'use client';
import React from 'react';
interface Props {
  jobId: string;
  status: string;
  progress: number;
  error?: string;
}
export function MediaProcessingStatus({ jobId, status, progress, error }: Props) {
  return (
    <section aria-label="Media processing">
      <h2>Media Processing</h2>
      <p>
        Job {jobId}: {status}
      </p>
      <progress value={progress} max={100} aria-label={`${progress}% complete`} />
      <p>{progress}%</p>
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
