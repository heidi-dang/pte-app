'use client';
import React from 'react';
interface Props {
  absoluteAgreement: number;
  toleranceAgreement: number;
  sampleCount: number;
  insufficientData: boolean;
}
export function AgreementMetricsDisplay({
  absoluteAgreement,
  toleranceAgreement,
  sampleCount,
  insufficientData,
}: Props) {
  return (
    <section aria-label="Agreement metrics">
      <h2>Agreement Metrics</h2>
      {insufficientData && <p role="alert">Insufficient data for reliable agreement calculation</p>}
      <p>Absolute agreement: {(absoluteAgreement * 100).toFixed(1)}%</p>
      <p>Tolerance agreement: {(toleranceAgreement * 100).toFixed(1)}%</p>
      <p>Samples: {sampleCount}</p>
    </section>
  );
}
