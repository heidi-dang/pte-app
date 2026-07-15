'use client';
import React from 'react';
interface Props {
  falsePositives: number;
  falseNegatives: number;
  coverage: number;
  partialData: boolean;
}
export function DiagnosticQualityDisplay({ falsePositives, falseNegatives, coverage, partialData }: Props) {
  return (
    <section aria-label="Diagnostic quality">
      <h2>Diagnostic Quality</h2>
      {partialData && <p role="alert">Partial data — results may not be complete</p>}
      <p>False positives: {falsePositives}</p>
      <p>False negatives: {falseNegatives}</p>
      <p>Coverage: {(coverage * 100).toFixed(1)}%</p>
    </section>
  );
}
