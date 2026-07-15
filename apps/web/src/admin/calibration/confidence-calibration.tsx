'use client';
import React from 'react';
interface Props {
  buckets: Array<{ label: string; observedAgreement: number; sampleCount: number }>;
  insufficientData: boolean;
}
export function ConfidenceCalibration({ buckets, insufficientData }: Props) {
  return (
    <section aria-label="Confidence calibration">
      <h2>Confidence Calibration</h2>
      {insufficientData && <p role="alert">Insufficient data for calibration</p>}
      {buckets.length === 0 ? (
        <p>No calibration data</p>
      ) : (
        <table>
          <caption>Calibration buckets</caption>
          <thead>
            <tr>
              <th>Bucket</th>
              <th>Observed Agreement</th>
              <th>Samples</th>
            </tr>
          </thead>
          <tbody>
            {buckets.map((b) => (
              <tr key={b.label}>
                <td>{b.label}</td>
                <td>{(b.observedAgreement * 100).toFixed(1)}%</td>
                <td>{b.sampleCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
