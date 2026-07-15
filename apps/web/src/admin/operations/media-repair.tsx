'use client';
import React from 'react';
interface Props {
  originalMediaId: string;
  originalPreserved: boolean;
  onRepair: () => void;
  processing?: boolean;
}
export function MediaRepair({ originalMediaId, originalPreserved, onRepair, processing }: Props) {
  return (
    <section aria-label="Media repair">
      <h2>Media Repair</h2>
      <p>Media: {originalMediaId}</p>
      <p>Original preserved: {originalPreserved ? 'Yes' : 'No'}</p>
      <button onClick={onRepair} disabled={processing || !originalPreserved}>
        Repair
      </button>
    </section>
  );
}
