'use client';
import React from 'react';

export function DataFreshness({ status, warning }: { status: string; warning?: string }) {
  return (
    <p role="status" aria-live="polite">
      Data freshness: {status}
      {warning && <span role="alert"> — {warning}</span>}
    </p>
  );
}
