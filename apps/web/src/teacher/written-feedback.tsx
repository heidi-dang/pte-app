'use client';
import React from 'react';
interface Props {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  saving?: boolean;
}
export function WrittenFeedback({ value, onChange, onSubmit, saving }: Props) {
  return (
    <section aria-label="Written feedback">
      <h2>Written Feedback</h2>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} aria-label="Feedback content" />
      <button onClick={onSubmit} disabled={saving}>
        {saving ? 'Saving...' : 'Submit'}
      </button>
    </section>
  );
}
