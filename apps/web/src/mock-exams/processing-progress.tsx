'use client';

import React from 'react';

export function ProcessingProgress({ state, progress }: { state: string; progress: number }) {
  return (
    <div
      role="progressbar"
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Processing: ${state}`}
    >
      {state}… {Math.round(progress)}%
    </div>
  );
}
