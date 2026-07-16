'use client';

import React from 'react';

export function MicrophoneCheck({ onReady, onError }: { onReady: () => void; onError: (msg: string) => void }) {
  React.useEffect(() => {
    if (!navigator.mediaDevices?.getUserMedia) {
      onError('Microphone access is not supported in this browser');
      return;
    }
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        stream.getTracks().forEach((t) => t.stop());
        onReady();
      })
      .catch(() => {
        onError('Microphone permission denied');
      });
  }, [onReady, onError]);

  return (
    <div role="status" aria-label="Checking microphone">
      Checking microphone…
    </div>
  );
}
