'use client';
import React from 'react';
interface Props {
  status: string;
  publishedAt?: string;
  error?: string;
}
export function PublicationStatus({ status, publishedAt, error }: Props) {
  return (
    <section aria-label="Publication status">
      <h2>Publication Status</h2>
      <p role="status">{status === 'published' ? `Published at ${publishedAt}` : `Status: ${status}`}</p>
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
