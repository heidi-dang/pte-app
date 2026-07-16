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
  const onCompleteRef = useRef(onComplete);
  const completedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (!profile.autoStartRecording || completedRef.current) return;
    if (remaining <= 0) {
      if (!completedRef.current) {
        completedRef.current = true;
        if (timerRef.current) clearInterval(timerRef.current);
        onCompleteRef.current();
      }
      return;
    }
    timerRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          return 0;
        }
        return r - 1;
      });
    }, interval);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [profile.autoStartRecording, interval]);

  useEffect(() => {
    if (remaining <= 0 && !completedRef.current) {
      completedRef.current = true;
      if (timerRef.current) clearInterval(timerRef.current);
      onCompleteRef.current();
    }
  }, [remaining]);

  return (
    <div role="timer" aria-live="polite" aria-label={`Preparation time: ${remaining} seconds`}>
      {remaining > 0 ? `Preparation: ${remaining}s` : 'Start speaking'}
    </div>
  );
}
