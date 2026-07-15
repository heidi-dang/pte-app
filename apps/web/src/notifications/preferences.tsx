'use client';
import React from 'react';
interface Props {
  preferences: Array<{ id: string; category: string; channel: string; enabled: boolean }>;
  onToggle: (id: string, enabled: boolean) => void;
}
export function NotificationPreferences({ preferences, onToggle }: Props) {
  return (
    <section aria-label="Notification preferences">
      <h2>Preferences</h2>
      {preferences.length === 0 ? (
        <p>No preferences</p>
      ) : (
        <ul>
          {preferences.map((p) => (
            <li key={p.id}>
              {p.category} ({p.channel}):{' '}
              <input
                type="checkbox"
                checked={p.enabled}
                onChange={(e) => onToggle(p.id, e.target.checked)}
                aria-label={`Enable ${p.category} ${p.channel}`}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
