'use client';
import React from 'react';
interface Props {
  onAdjust: (userId: string, change: Record<string, unknown>) => void;
}
export function AdminEntitlements({ onAdjust }: Props) {
  return (
    <section aria-label="Entitlement administration">
      <h2>Entitlements</h2>
      <button onClick={() => onAdjust('user1', {})}>Request Adjustment</button>
    </section>
  );
}
