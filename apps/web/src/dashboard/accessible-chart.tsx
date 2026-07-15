'use client';
import React from 'react';

interface AccessibleChartProps {
  title: string;
  summary: string;
  dataPoints: Array<{ label: string; value: number }>;
  type: 'bar' | 'line' | 'table';
  status?: string;
}

export function AccessibleChart({ title, summary, dataPoints, type, status }: AccessibleChartProps) {
  return (
    <figure aria-label={title} role="img">
      <figcaption>{title}</figcaption>
      <p>{summary}</p>
      {status && <p role="status">Status: {status}</p>}
      <table>
        <caption>{title} data</caption>
        <thead>
          <tr>
            <th>Category</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          {dataPoints.length === 0 ? (
            <tr>
              <td colSpan={2}>No data</td>
            </tr>
          ) : (
            dataPoints.map((p, i) => (
              <tr key={i}>
                <td>{p.label}</td>
                <td>{p.value.toFixed(2)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </figure>
  );
}
