'use client';

import React from 'react';

export type AutosavePhase = 'idle' | 'saving' | 'saved' | 'error';

export interface AutosaveStatusProps {
  phase: AutosavePhase;
  lastSavedAt?: string | null;
  errorMessage?: string | null;
}

const PHASE_LABELS: Record<AutosavePhase, string> = {
  idle: '',
  saving: 'Saving…',
  saved: 'Saved',
  error: 'Save failed',
};

/**
 * AutosaveStatus renders a small indicator that communicates the current
 * autosave phase to both sighted users and screen readers.
 *
 * Uses aria-live="polite" so that status changes are announced without
 * interrupting ongoing speech.
 */
export function AutosaveStatus({ phase, lastSavedAt, errorMessage }: AutosaveStatusProps) {
  const label = PHASE_LABELS[phase];

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      aria-label="Autosave status"
      role="status"
      style={{ fontSize: '0.75rem', color: phase === 'error' ? 'var(--color-error, #b00020)' : 'var(--color-muted, #666)' }}
    >
      {phase === 'saving' && (
        <span aria-hidden="true" style={{ marginRight: '0.25rem' }}>
          ⟳
        </span>
      )}
      {phase === 'saved' && (
        <span aria-hidden="true" style={{ marginRight: '0.25rem' }}>
          ✓
        </span>
      )}
      {phase === 'error' && (
        <span aria-hidden="true" style={{ marginRight: '0.25rem' }}>
          ✕
        </span>
      )}
      <span>{label}</span>
      {phase === 'saved' && lastSavedAt && (
        <time dateTime={lastSavedAt} style={{ marginLeft: '0.25rem' }}>
          {new Date(lastSavedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </time>
      )}
      {phase === 'error' && errorMessage && (
        <span role="alert" style={{ marginLeft: '0.25rem' }}>
          {errorMessage}
        </span>
      )}
    </div>
  );
}
