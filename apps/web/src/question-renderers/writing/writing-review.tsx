'use client';

import React from 'react';
import type { WritingReviewData } from '@pte-app/contracts';

export function WritingReview({ review }: { review: WritingReviewData }) {
  return (
    <div role="region" aria-label="Writing review">
      <h3>Review</h3>
      <dl>
        <dt>Word count</dt>
        <dd>{review.wordCount}</dd>
        <dt>Character count</dt>
        <dd>{review.charCount}</dd>
        <dt>Meets minimum</dt>
        <dd>{review.meetsMinimumWords ? 'Yes' : 'No'}</dd>
        <dt>Exceeds maximum</dt>
        <dd>{review.exceedsMaximumWords ? 'Yes' : 'No'}</dd>
      </dl>
    </div>
  );
}
