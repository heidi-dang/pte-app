'use client';
import React from 'react';
interface Props {
  ownerId?: string;
  expiresAt?: string;
  onRenew: () => void;
  onRelease: () => void;
}
export function ReviewLockStatus({ ownerId, expiresAt, onRenew, onRelease }: Props) {
  if (!ownerId)
    return (
      <section aria-label="Review lock">
        <p>No active lock</p>
      </section>
    );
  return (
    <section aria-label="Review lock">
      <p>
        Locked by {ownerId} {expiresAt ? `until ${expiresAt}` : ''}
      </p>
      <button onClick={onRenew}>Renew</button>
      <button onClick={onRelease}>Release</button>
    </section>
  );
}
