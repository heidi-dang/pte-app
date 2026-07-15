'use client';
import React from 'react';
interface Props {
  severity: string;
  status: string;
  evidence: Record<string, number>;
}
export function DriftStatus({ severity, status, evidence }: Props) {
  return (
    <section aria-label="Drift status">
      <h2>Drift Detection</h2>
      <p>Severity: {severity}</p>
      <p>Status: {status}</p>
      {Object.keys(evidence).length > 0 && (
        <table>
          <caption>Drift evidence</caption>
          <thead>
            <tr>
              <th>Metric</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(evidence).map(([k, v]) => (
              <tr key={k}>
                <td>{k}</td>
                <td>{v.toFixed(3)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
