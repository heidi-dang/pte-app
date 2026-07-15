'use client';
import React from 'react';
interface Props {
  results: Array<{ contentId: string; success: boolean; error?: string }>;
  total: number;
}
export function BatchProgress({ results, total }: Props) {
  const success = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;
  return (
    <section aria-label="Batch progress">
      <h2>Batch Progress</h2>
      <progress value={success + failed} max={total} aria-label={`${success + failed} of ${total} complete`} />
      <p>
        {success} succeeded, {failed} failed of {total}
      </p>
      {failed > 0 && (
        <ul>
          {results
            .filter((r) => !r.success)
            .map((r) => (
              <li key={r.contentId} role="alert">
                {r.contentId}: {r.error}
              </li>
            ))}
        </ul>
      )}
    </section>
  );
}
