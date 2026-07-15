'use client';
import React from 'react';
interface Props {
  action: string;
  onConfirm: () => void;
  onCancel: () => void;
  open: boolean;
}
export function SensitiveActionDialog({ action, onConfirm, onCancel, open }: Props) {
  if (!open) return null;
  return (
    <dialog open aria-label="Confirm sensitive action">
      <p>Confirm {action}?</p>
      <button onClick={onConfirm}>Confirm</button>
      <button onClick={onCancel}>Cancel</button>
    </dialog>
  );
}
