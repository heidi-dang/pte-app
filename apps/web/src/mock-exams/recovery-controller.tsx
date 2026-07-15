'use client';

import React from 'react';
import type { MockSession } from '@pte-app/contracts';

interface RecoverySnapshot {
  session: MockSession;
  serverNowAtSnapshot: string;
  clientReceivedAt: string;
}

function computeRecovery(snapshot: RecoverySnapshot) {
  const { session, serverNowAtSnapshot, clientReceivedAt } = snapshot;
  const serverNowMs = new Date(serverNowAtSnapshot).getTime();
  const clientReceivedMs = new Date(clientReceivedAt).getTime();
  const clientNowMs = Date.now();

  const elapsedSinceSnapshotMs = clientNowMs - clientReceivedMs;
  const reconstructedServerNowMs = serverNowMs + elapsedSinceSnapshotMs;
  const deadlineMs = new Date(session.serverDeadline).getTime();

  const remaining = Math.max(0, deadlineMs - reconstructedServerNowMs);
  const canResume =
    remaining > 0 &&
    session.state !== 'completed' &&
    session.state !== 'failed-terminal' &&
    session.state !== 'abandoned';

  return { remaining, canResume };
}

export function MockRecoveryController({
  recoverySnapshot,
  onReconnect,
}: {
  recoverySnapshot: RecoverySnapshot;
  onReconnect: (remainingMs: number) => void;
}) {
  const recovery = computeRecovery(recoverySnapshot);

  if (!recovery.canResume) {
    return (
      <div role="alert">
        <p>This session cannot be resumed.</p>
      </div>
    );
  }

  return (
    <div role="region" aria-label="Session recovery">
      <p>Reconnecting… {Math.round(recovery.remaining / 1000)}s remaining</p>
      <button onClick={() => onReconnect(recovery.remaining)} type="button">
        Resume session
      </button>
    </div>
  );
}
