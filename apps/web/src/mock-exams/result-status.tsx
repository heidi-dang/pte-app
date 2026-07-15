'use client';

import React from 'react';

export function ResultStatus({
  result,
}: {
  result?: { overallScore: number; isComplete: boolean; missingComponents: string[] } | null;
}) {
  if (!result) return <div role="status">Result not available</div>;

  return (
    <div role="region" aria-label="Mock exam result">
      <h2>Result</h2>
      <p>Overall score: {result.overallScore}</p>
      <p>Complete: {result.isComplete ? 'Yes' : 'No'}</p>
      {result.missingComponents.length > 0 && <p>Missing: {result.missingComponents.join(', ')}</p>}
    </div>
  );
}
