'use client';
import React from 'react';

export function NotificationCentre({
  notifications,
}: {
  notifications: Array<{ id: string; type: string; status: string }>;
}) {
  return (
    <section aria-label="Notifications">
      {notifications.length === 0 ? (
        <p>No notifications</p>
      ) : (
        <ul>
          {notifications.map((n) => (
            <li key={n.id}>
              {n.type} — {n.status}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
