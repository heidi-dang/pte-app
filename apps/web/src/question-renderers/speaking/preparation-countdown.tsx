'use client';

import React, { useEffect, useState } from 'react';

export function PreparationCountdown({
  seconds,
  autoStart,
  onComplete,
}: {
  seconds: number;
  autoStart: boolean;
  onComplete: () => void;
}) {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    if (!autoStart || remaining <= 0) return;
    const timer = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(timer);
          onComplete();
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [autoStart, remaining, onComplete]);

  return (
    <div role="timer" aria-live="polite" aria-label={`Preparation time: ${remaining} seconds`}>
      {remaining > 0 ? `Preparation: ${remaining}s` : 'Start speaking'}
    </div>
  );
}
