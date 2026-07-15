'use client';

import React from 'react';

export function MockShell({
  children,
  currentSection,
  progress,
}: {
  children: React.ReactNode;
  currentSection: string;
  progress: { completed: number; total: number };
}) {
  return (
    <div role="main" aria-label={`Mock exam - ${currentSection}`}>
      <div aria-label="Section progress" style={{ padding: '8px', borderBottom: '1px solid #ccc' }}>
        Section: {currentSection} | Progress: {progress.completed}/{progress.total}
      </div>
      {children}
    </div>
  );
}
