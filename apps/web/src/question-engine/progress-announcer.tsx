'use client';

import React, { useEffect, useRef } from 'react';
import type { QuestionProgressEventType } from '@pte-app/contracts';

export interface ProgressAnnouncerProps {
  /** The most recently dispatched event type, or null if none. */
  latestEvent: QuestionProgressEventType | null;
  /** Override the generated message for a given event type. */
  messageOverrides?: Partial<Record<QuestionProgressEventType, string>>;
}

const DEFAULT_MESSAGES: Record<QuestionProgressEventType, string> = {
  'session.created': 'Session created.',
  'session.started': 'Session started.',
  'session.paused': 'Session paused.',
  'session.resumed': 'Session resumed.',
  'session.recovered': 'Session recovered from local storage.',
  'response.save-started': '',
  'response.saved': 'Response saved.',
  'response.save-failed': 'Failed to save response. Please try again.',
  'timer.warning': 'Warning: little time remaining.',
  'timer.expired': 'Time has expired.',
  'playback.ready': 'Audio is ready to play.',
  'playback.started': 'Audio playback started.',
  'playback.consumed': 'Audio play count used.',
  'playback.completed': 'Audio playback complete.',
  'playback.failed': 'Audio playback failed.',
  'submission.started': 'Submitting your response…',
  'submission.completed': 'Response submitted successfully.',
  'submission.failed': 'Submission failed. Please try again.',
  'session.abandoned': 'Session abandoned.',
};

/**
 * ProgressAnnouncer is a visually hidden aria-live region that announces
 * question-engine session events to screen reader users.
 *
 * It uses aria-live="assertive" only for critical events (timer, submission)
 * and "polite" for informational events.
 */
export function ProgressAnnouncer({ latestEvent, messageOverrides }: ProgressAnnouncerProps) {
  const assertiveRef = useRef<HTMLDivElement>(null);
  const politeRef = useRef<HTMLDivElement>(null);

  const ASSERTIVE_EVENTS = new Set<QuestionProgressEventType>([
    'timer.warning',
    'timer.expired',
    'submission.failed',
    'response.save-failed',
    'playback.failed',
  ]);

  useEffect(() => {
    if (!latestEvent) return;

    const messages = { ...DEFAULT_MESSAGES, ...messageOverrides };
    const message = messages[latestEvent];
    if (!message) return;

    const isAssertive = ASSERTIVE_EVENTS.has(latestEvent);
    const el = isAssertive ? assertiveRef.current : politeRef.current;
    if (!el) return;

    // Clear then set to trigger re-announcement even if message is unchanged
    el.textContent = '';
    requestAnimationFrame(() => {
      el.textContent = message;
    });
  }, [latestEvent, messageOverrides]);

  const srOnly: React.CSSProperties = {
    position: 'absolute',
    width: '1px',
    height: '1px',
    padding: '0',
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0,0,0,0)',
    whiteSpace: 'nowrap',
    border: '0',
  };

  return (
    <>
      <div ref={assertiveRef} role="alert" aria-live="assertive" aria-atomic="true" style={srOnly} />
      <div ref={politeRef} role="status" aria-live="polite" aria-atomic="true" style={srOnly} />
    </>
  );
}
