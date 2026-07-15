'use client';
import React from 'react';
interface Props {
  content: { id: string; title: string };
  onApprove: (reason: string) => void;
  onReject: (reason: string) => void;
  onRequestChanges: (notes: string) => void;
  submitting?: boolean;
}
export function ReviewWorkspace({ content, onApprove, onReject, onRequestChanges, submitting }: Props) {
  const [reason, setReason] = React.useState('');
  return (
    <section aria-label="Review workspace">
      <h2>Review: {content.title}</h2>
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        aria-label="Review reason"
        disabled={submitting}
      />
      <button onClick={() => onApprove(reason)} disabled={submitting || !reason.trim()}>
        Approve
      </button>
      <button onClick={() => onReject(reason)} disabled={submitting || !reason.trim()}>
        Reject
      </button>
      <button onClick={() => onRequestChanges(reason)} disabled={submitting || !reason.trim()}>
        Request Changes
      </button>
    </section>
  );
}
