'use client';

import React from 'react';

export function InterruptionMessage({ message, onReconnect }: { message: string; onReconnect: () => void }) {
  return (
    <div role="alert" aria-label="Session interruption">
      <p>{message}</p>
      <button onClick={onReconnect} type="button">
        Reconnect
      </button>
    </div>
  );
}
