'use client';

import React from 'react';

export function RecordingRecovery({
  recordingState,
  onRetry,
  onAbandon,
}: {
  recordingState: string;
  onRetry: () => void;
  onAbandon: () => void;
}) {
  return (
    <div role="alert" aria-label="Recording recovery required">
      <p>Your recording was interrupted ({recordingState}).</p>
      <button onClick={onRetry} type="button">
        Retry upload
      </button>
      <button onClick={onAbandon} type="button">
        Abandon recording
      </button>
    </div>
  );
}
