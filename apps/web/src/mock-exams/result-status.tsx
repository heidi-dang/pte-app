'use client';

import React from 'react';

interface ResultStatusProps {
  result?: {
    overallScore: number;
    isComplete: boolean;
    missingComponents: string[];
    profileVersion?: number;
    confidence?: number;
    resultClassification?: string;
  } | null;
}

export function ResultStatus({ result }: ResultStatusProps) {
  if (!result) return <div role="status">Result not available</div>;

  return (
    <div role="region" aria-label="Mock exam result">
      <h2>Estimated training result</h2>
      <p>Estimated score: {result.overallScore}</p>
      {result.profileVersion !== undefined && <p>Profile version: {result.profileVersion}</p>}
      <p>Status: {result.isComplete ? 'Complete' : 'Partial — some components missing'}</p>
      {result.missingComponents.length > 0 && <p>Missing components: {result.missingComponents.join(', ')}</p>}
      {result.confidence !== undefined && <p>Confidence: {Math.round(result.confidence * 100)}%</p>}
    </div>
  );
}
