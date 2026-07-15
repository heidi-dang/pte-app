'use client';
import React from 'react';

export function ContentFactoryShell({ children }: { children: React.ReactNode }) {
  return (
    <div role="region" aria-label="Content Factory">
      {children}
    </div>
  );
}
