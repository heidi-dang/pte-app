'use client';

import React from 'react';

export function RecordingStatus({
  state,
  duration,
  maxDuration,
}: {
  state: string;
  duration: number;
  maxDuration: number;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={`Recording status: ${state}, ${duration} of ${maxDuration} seconds`}
    >
      <span aria-hidden="true">{state === 'recording' ? '●' : '○'}</span>
      <span>
        {duration}s / {maxDuration}s
      </span>
    </div>
  );
}
