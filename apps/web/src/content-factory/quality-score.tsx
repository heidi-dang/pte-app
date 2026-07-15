'use client';
import React from 'react';
interface Props {
  overall: number;
  components: Record<string, number>;
  failed: string[];
}
export function QualityScoreDisplay({ overall, components, failed }: Props) {
  return (
    <section aria-label="Quality score">
      <h2>Quality Score: {overall.toFixed(2)}</h2>
      {failed.length > 0 && (
        <div role="alert">
          <p>Failed requirements:</p>
          <ul>
            {failed.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </div>
      )}
      <table>
        <caption>Component scores</caption>
        <thead>
          <tr>
            <th>Component</th>
            <th>Score</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(components).map(([k, v]) => (
            <tr key={k}>
              <td>{k}</td>
              <td>{v.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
