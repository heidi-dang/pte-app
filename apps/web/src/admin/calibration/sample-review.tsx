'use client';
import React from 'react';
interface Props {
  samples: Array<{ id: string; agreementStatus: string; confidence: number }>;
  onReview: (id: string) => void;
}
export function SampleReview({ samples, onReview }: Props) {
  return (
    <section aria-label="Sample review">
      <h2>Sample Review</h2>
      {samples.length === 0 ? (
        <p>No samples to review</p>
      ) : (
        <ul>
          {samples.map((s) => (
            <li key={s.id}>
              {s.agreementStatus} (confidence: {s.confidence.toFixed(2)}){' '}
              <button onClick={() => onReview(s.id)}>Review</button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
