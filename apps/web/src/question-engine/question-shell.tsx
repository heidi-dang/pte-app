'use client';

import React, { type ReactNode } from 'react';

export interface QuestionShellProps {
  sessionId: string;
  questionType: string;
  sessionMode: string;
  children: ReactNode;
  /** Slot for the timer component */
  timer?: ReactNode;
  /** Slot for the autosave status indicator */
  autosaveStatus?: ReactNode;
  /** Slot for the progress announcer (aria-live) */
  progressAnnouncer?: ReactNode;
  className?: string;
}

/**
 * QuestionShell provides the layout wrapper for any question renderer.
 * It owns the landmark regions and passes slots through to children.
 * No question-type-specific logic lives here — this is purely structural.
 */
export function QuestionShell({
  sessionId,
  questionType,
  sessionMode,
  children,
  timer,
  autosaveStatus,
  progressAnnouncer,
  className,
}: QuestionShellProps) {
  return (
    <section
      aria-label={`Question: ${questionType}`}
      data-session-id={sessionId}
      data-question-type={questionType}
      data-session-mode={sessionMode}
      className={className}
      style={{ position: 'relative', width: '100%' }}
    >
      {/* Status bar: timer + autosave */}
      <div
        role="status"
        aria-label="Question status"
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}
      >
        <div aria-label="Time remaining">{timer}</div>
        <div aria-label="Save status">{autosaveStatus}</div>
      </div>

      {/* Main question content */}
      <main aria-label="Question content">{children}</main>

      {/* Accessible live-region announcements (visually hidden) */}
      {progressAnnouncer}
    </section>
  );
}
