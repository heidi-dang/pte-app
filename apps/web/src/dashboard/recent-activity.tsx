'use client';
import React from 'react';

export function RecentActivity({
  activities,
}: {
  activities: Array<{ id: string; description: string; createdAt: string }>;
}) {
  return (
    <section aria-label="Recent activity">
      <h2>Recent Activity</h2>
      {activities.length === 0 ? (
        <p>No recent activity</p>
      ) : (
        <ul>
          {activities.map((a) => (
            <li key={a.id}>
              {a.description} <time>{a.createdAt}</time>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
