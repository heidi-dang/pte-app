'use client';
import React from 'react';
interface Props {
  taskCoverage: Record<string, { total: number; published: number }>;
  gaps: Array<{ category: string; description: string }>;
}
export function CoverageDashboard({ taskCoverage, gaps }: Props) {
  return (
    <section aria-label="Coverage dashboard">
      <h2>Content Coverage</h2>
      {Object.keys(taskCoverage).length === 0 ? (
        <p>No coverage data</p>
      ) : (
        <table>
          <caption>Task-type coverage</caption>
          <thead>
            <tr>
              <th>Task</th>
              <th>Total</th>
              <th>Published</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(taskCoverage).map(([k, v]) => (
              <tr key={k}>
                <td>{k}</td>
                <td>{v.total}</td>
                <td>{v.published}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {gaps.length > 0 && (
        <div role="alert">
          <p>Gaps:</p>
          <ul>
            {gaps.map((g) => (
              <li key={g.category}>{g.description}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
