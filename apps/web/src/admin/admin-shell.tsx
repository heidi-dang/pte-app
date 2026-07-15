'use client';
import React from 'react';

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div role="region" aria-label="Admin Portal">
      {children}
    </div>
  );
}
