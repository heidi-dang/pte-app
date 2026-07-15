'use client';

import React from 'react';
import type { MockSession } from '@pte-app/contracts';

function buildRecovery(session: MockSession) {
  const now = Date.now();
  const deadline = new Date(session.serverDeadline).getTime();
  const remaining = Math.max(0, deadline - now);
  const canResume = session.state === 'active' || session.state === 'section-transition';
  return { canResume, remainingTimeMs: remaining };
}

export function MockRecoveryController({
  session,
  onReconnect,
}: {
  session: MockSession;
  onReconnect: (remainingMs: number) => void;
}) {
  const recovery = buildRecovery(session);

  if (!recovery.canResume) {
    return (
      <div role="alert">
        <p>This session cannot be resumed.</p>
      </div>
    );
  }

  return (
    <div role="region" aria-label="Session recovery">
      <p>Reconnecting… {Math.round(recovery.remainingTimeMs / 1000)}s remaining</p>
      <button onClick={() => onReconnect(recovery.remainingTimeMs)} type="button">
        Resume session
      </button>
    </div>
  );
}
