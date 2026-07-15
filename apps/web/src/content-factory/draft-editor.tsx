'use client';
import React from 'react';
interface Props {
  draft: { id: string; title: string; lifecycleState: string };
  onSave: (body: Record<string, unknown>) => void;
  onTransition: (to: string) => void;
}
export function DraftEditor({ draft, onSave, onTransition }: Props) {
  return (
    <section aria-label="Draft editor">
      <h2>{draft.title}</h2>
      <p>State: {draft.lifecycleState}</p>
      <button onClick={() => onTransition('ready-for-validation')}>Submit for Validation</button>
    </section>
  );
}
