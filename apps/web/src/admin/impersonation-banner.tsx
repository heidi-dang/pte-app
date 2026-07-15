'use client';
import React from 'react';
interface Props {
  active: boolean;
  targetUser?: string;
  onEnd: () => void;
}
export function ImpersonationBanner({ active, targetUser, onEnd }: Props) {
  if (!active) return null;
  return (
    <div role="alert" aria-live="assertive" style={{ background: '#ff0', padding: '8px' }}>
      Impersonating {targetUser} <button onClick={onEnd}>Stop Impersonation</button>
    </div>
  );
}
