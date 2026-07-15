'use client';
import React from 'react';

interface EntitlementAdjustmentRequest {
  userId: string;
  requestedChange: Record<string, unknown>;
  reason: string;
}

interface Props {
  onAdjust: (request: EntitlementAdjustmentRequest) => void;
}

export function AdminEntitlements({ onAdjust }: Props) {
  const [userId, setUserId] = React.useState('');
  const [reason, setReason] = React.useState('');
  const [feature, setFeature] = React.useState('');
  return (
    <section aria-label="Entitlement administration">
      <h2>Entitlements</h2>
      <label>
        User ID: <input value={userId} onChange={(e) => setUserId(e.target.value)} aria-label="Target user ID" />
      </label>
      <label>
        Feature: <input value={feature} onChange={(e) => setFeature(e.target.value)} aria-label="Feature to adjust" />
      </label>
      <label>
        Reason: <input value={reason} onChange={(e) => setReason(e.target.value)} aria-label="Adjustment reason" />
      </label>
      <button
        onClick={() => onAdjust({ userId, requestedChange: { featureFlag: feature }, reason })}
        disabled={!userId || !reason}
      >
        Request Adjustment
      </button>
    </section>
  );
}
