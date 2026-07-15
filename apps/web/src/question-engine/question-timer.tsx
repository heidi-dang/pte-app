'use client';

import React, { useEffect, useRef, useState } from 'react';
import type { TimerDisplayProfile } from '@pte-app/contracts';

export interface QuestionTimerProps {
  /**
   * The authoritative server deadline expressed as an ISO-8601 string.
   * The timer derives its countdown from this value, NOT from local Date.now(),
   * to avoid clock skew issues. The skew offset is computed once at mount using
   * serverNowAtCreation vs. local clock.
   */
  serverDeadline: string;
  /**
   * The server's "now" at the moment the timer state was created.
   * Used to compute the initial clock-skew offset.
   */
  serverNowAtCreation: string;
  /** Timer display profile driving refresh interval and warning thresholds. */
  displayProfile?: TimerDisplayProfile;
  onWarning?: () => void;
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

/**
 * QuestionTimer derives countdown from the server deadline to avoid client
 * clock skew. It computes a one-time skew offset at mount and applies it
 * on every tick so all subsequent calculations reference server time.
 *
 * The refresh interval and warning thresholds are driven by a TimerDisplayProfile.
 */
export function QuestionTimer({
  serverDeadline,
  serverNowAtCreation,
  displayProfile,
  onWarning,
  onExpired,
  className,
}: QuestionTimerProps) {
  const refreshIntervalMs = displayProfile?.refreshIntervalMs ?? 1000;
  const warningThresholdsMs = displayProfile?.warningThresholdsMs ?? [60_000];

  const skewOffsetMs = useRef<number>(0);
  const warningFiredRef = useRef(false);
  const expiredFiredRef = useRef(false);

  const computeRemaining = (): number => {
    const nowServer = Date.now() - skewOffsetMs.current;
    const deadline = new Date(serverDeadline).getTime();
    return Math.max(0, deadline - nowServer);
  };

  // Compute skew once on mount
  useEffect(() => {
    const localNow = Date.now();
    const serverNow = new Date(serverNowAtCreation).getTime();
    skewOffsetMs.current = localNow - serverNow;
    warningFiredRef.current = false;
    expiredFiredRef.current = false;
  }, [serverNowAtCreation]);

  const [remainingMs, setRemainingMs] = useState<number>(computeRemaining);

  useEffect(() => {
    const tick = () => {
      const remaining = computeRemaining();
      setRemainingMs(remaining);

      if (!warningFiredRef.current) {
        const shouldWarn = warningThresholdsMs.some((threshold) => remaining <= threshold && remaining > 0);
        if (shouldWarn) {
          warningFiredRef.current = true;
          onWarning?.();
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
  }, [serverDeadline, refreshIntervalMs, warningThresholdsMs.join(',')]);

  const lowestThreshold = Math.max(...warningThresholdsMs);
  const isWarning = remainingMs <= lowestThreshold && remainingMs > 0;
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
