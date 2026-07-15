'use client';
import React from 'react';
interface Props {
  review: { id: string; status: string } | null;
  onStart: () => void;
  onLock: () => void;
}
export function ResponseReview({ review, onStart, onLock }: Props) {
  if (!review)
    return (
      <section aria-label="Response review">
        <p>No review selected</p>
      </section>
    );
  return (
    <section aria-label="Response review">
      <h2>Response Review</h2>
      <p>Status: {review.status}</p>
      <button onClick={onStart}>Start Review</button>
      <button onClick={onLock}>Acquire Lock</button>
    </section>
  );
}
