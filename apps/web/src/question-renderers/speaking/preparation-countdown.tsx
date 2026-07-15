'use client';

import React, { useEffect, useRef, useState } from 'react';
import type { PreparationPolicy } from '@pte-app/contracts';

const DEFAULT_REFRESH_INTERVAL_MS = 1000;

export function PreparationCountdown({
  profile,
  onComplete,
  refreshIntervalMs,
}: {
  profile: PreparationPolicy;
  onComplete: () => void;
  refreshIntervalMs?: number;
}) {
  const interval = refreshIntervalMs ?? DEFAULT_REFRESH_INTERVAL_MS;
  const [remaining, setRemaining] = useState(profile.countdownSeconds);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!profile.autoStartRecording || remaining <= 0) return;
    timerRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          onComplete();
          return 0;
        }
        return r - 1;
      });
    }, interval);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [profile.autoStartRecording, remaining, onComplete, interval]);

  return (
    <div role="timer" aria-live="polite" aria-label={`Preparation time: ${remaining} seconds`}>
      {remaining > 0 ? `Preparation: ${remaining}s` : 'Start speaking'}
    </div>
  );
}
