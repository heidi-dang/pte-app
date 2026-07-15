'use client';

import React from 'react';

export function WordCount({ current, min, max }: { current: number; min: number; max: number }) {
  const status = current < min ? 'below' : current > max ? 'above' : 'within';
  const label =
    status === 'below'
      ? `${current} words (minimum ${min})`
      : status === 'above'
        ? `${current} words (maximum ${max})`
        : `${current} words`;

  return (
    <div role="status" aria-live="polite" aria-label={label}>
      <span>{current} words</span>
      {status === 'below' && <span style={{ color: 'orange' }}> (min {min})</span>}
      {status === 'above' && <span style={{ color: 'red' }}> (max {max})</span>}
    </div>
  );
}
