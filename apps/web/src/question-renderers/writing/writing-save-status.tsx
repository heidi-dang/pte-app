'use client';

import React from 'react';

export function WritingSaveStatus({ state }: { state: 'idle' | 'saving' | 'saved' | 'error' }) {
  const labels: Record<string, string> = {
    idle: '',
    saving: 'Saving…',
    saved: 'Saved',
    error: 'Save failed',
  };

  return (
    <div role="status" aria-live="polite" aria-label={labels[state] || state}>
      {labels[state]}
    </div>
  );
}
