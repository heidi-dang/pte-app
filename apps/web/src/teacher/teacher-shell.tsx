'use client';
import React from 'react';

export function TeacherShell({ children }: { children: React.ReactNode }) {
  return (
    <div role="region" aria-label="Teacher Portal">
      {children}
    </div>
  );
}
