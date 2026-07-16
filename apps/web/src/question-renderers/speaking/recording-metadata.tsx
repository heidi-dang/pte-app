'use client';

import React from 'react';

export function RecordingMetadata({
  state,
  durationMs,
}: {
  state: string;
  durationMs: number | null;
}) {
  const durationSeconds = durationMs != null ? (durationMs / 1000).toFixed(1) : null;
  return (
    <div
      role="status"
      aria-label="Recording metadata"
      style={{
        padding: '1rem',
        background: 'var(--color-surface)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--color-border)',
      }}
    >
      <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Recording complete</p>
      <div style={{ fontSize: '0.875rem', color: 'var(--color-muted)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <span>State: {state}</span>
        {durationSeconds && <span>Duration: {durationSeconds}s</span>}
      </div>
    </div>
  );
}
