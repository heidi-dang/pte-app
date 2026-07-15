'use client';
import React from 'react';

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div role="region" aria-label="Student Dashboard">
      {children}
    </div>
  );
}
