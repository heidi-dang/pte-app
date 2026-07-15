'use client';
import React from 'react';

export function EstimatedScoreTrend({
  dataPoints,
  warnings,
}: {
  dataPoints: Array<{ timestamp: string; value: number }>;
  warnings?: string[];
}) {
  return (
    <section aria-label="Estimated training score trend">
      <h2>Estimated Training Score Trend</h2>
      {warnings?.map((w, i) => (
        <p key={i} role="alert">
          {w}
        </p>
      ))}
      {dataPoints.length === 0 ? (
        <p>Insufficient data for trend</p>
      ) : (
        <table>
          <caption>Score trend data points</caption>
          <thead>
            <tr>
              <th>Date</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
            {dataPoints.map((p, i) => (
              <tr key={i}>
                <td>{p.timestamp}</td>
                <td>{p.value.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
