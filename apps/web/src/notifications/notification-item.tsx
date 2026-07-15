'use client';
import React from 'react';
interface Props {
  notification: { id: string; type: string; status: string; createdAt: string };
  onDismiss?: (id: string) => void;
}
export function NotificationItem({ notification, onDismiss }: Props) {
  return (
    <li role="status" aria-live="polite">
      {notification.type} — {notification.status} <time>{notification.createdAt}</time>
      {onDismiss && <button onClick={() => onDismiss(notification.id)}>Dismiss</button>}
    </li>
  );
}
