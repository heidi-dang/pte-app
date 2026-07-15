'use client';

import React, { useEffect, useRef, useState } from 'react';
import type { TimerDisplayProfile } from '@pte-app/contracts';

export interface QuestionTimerProps {
  serverDeadline: string;
  serverNowAtCreation: string;
  displayProfile: TimerDisplayProfile;
  onWarning?: (thresholdMs: number) => void;
  onExpired?: () => void;
  className?: string;
}

function formatDuration(ms: number): string {
  if (ms <= 0) return '0:00';
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function sortedThresholdsKey(thresholds: readonly number[]): string {
  return [...thresholds].sort((a, b) => a - b).join(',');
}

/**
 * QuestionTimer derives countdown from the server deadline to avoid client
 * clock skew. It computes a one-time skew offset at mount and applies it
 * on every tick so all subsequent calculations reference server time.
 *
 * The refresh interval and warning thresholds are driven by a required
 * TimerDisplayProfile. No fallback values exist in this component.
 */
export function QuestionTimer({
  serverDeadline,
  serverNowAtCreation,
  displayProfile,
  onWarning,
  onExpired,
  className,
}: QuestionTimerProps) {
  const { refreshIntervalMs, warningThresholdsMs } = displayProfile;
  const sortedThresholds = [...warningThresholdsMs].sort((a, b) => a - b);

  const skewOffsetMs = useRef<number>(0);
  const firedWarningsRef = useRef<Set<number>>(new Set());
  const expiredFiredRef = useRef(false);

  const computeRemaining = (): number => {
    const nowServer = Date.now() - skewOffsetMs.current;
    const deadline = new Date(serverDeadline).getTime();
    return Math.max(0, deadline - nowServer);
  };

  useEffect(() => {
    const localNow = Date.now();
    const serverNow = new Date(serverNowAtCreation).getTime();
    skewOffsetMs.current = localNow - serverNow;
    firedWarningsRef.current = new Set();
    expiredFiredRef.current = false;
  }, [serverNowAtCreation, sortedThresholdsKey(sortedThresholds)]);

  const [remainingMs, setRemainingMs] = useState<number>(computeRemaining);

  useEffect(() => {
    firedWarningsRef.current = new Set();
    expiredFiredRef.current = false;

    const tick = () => {
      const remaining = computeRemaining();
      setRemainingMs(remaining);

      for (const threshold of sortedThresholds) {
        if (!firedWarningsRef.current.has(threshold) && remaining <= threshold && remaining > 0) {
          firedWarningsRef.current.add(threshold);
          onWarning?.(threshold);
        }
      }

      if (!expiredFiredRef.current && remaining === 0) {
        expiredFiredRef.current = true;
        onExpired?.();
      }
    };

    const id = setInterval(tick, refreshIntervalMs);
    tick();
    return () => clearInterval(id);
  }, [serverDeadline, refreshIntervalMs, sortedThresholdsKey(sortedThresholds)]);

  const lowestThreshold = sortedThresholds.length > 0 ? Math.max(...sortedThresholds) : 0;
  const isWarning = lowestThreshold > 0 && remainingMs <= lowestThreshold && remainingMs > 0;
  const isExpired = remainingMs === 0;
  const displayText = formatDuration(remainingMs);

  return (
    <div
      role="timer"
      aria-label={isExpired ? 'Time expired' : `${displayText} remaining`}
      aria-live={isWarning || isExpired ? 'assertive' : 'off'}
      className={className}
      style={{
        fontVariantNumeric: 'tabular-nums',
        color: isExpired
          ? 'var(--color-error, #b00020)'
          : isWarning
            ? 'var(--color-warning, #e65100)'
            : 'var(--color-foreground, inherit)',
        fontWeight: isWarning || isExpired ? '700' : '500',
      }}
    >
      {isExpired ? 'Time expired' : displayText}
    </div>
  );
}
