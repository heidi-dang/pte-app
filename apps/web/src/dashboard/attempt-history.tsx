'use client';
import React from 'react';

interface AttemptHistoryProps {
  entries: Array<{
    attemptId: string;
    taskType: string;
    submittedAt: string;
    estimatedScore: number;
    resultState: string;
  }>;
  total: number;
  loading?: boolean;
}

export function AttemptHistory({ entries, total, loading }: AttemptHistoryProps) {
  if (loading)
    return (
      <section aria-label="Attempt history">
        <p>Loading...</p>
      </section>
    );
  return (
    <section aria-label="Attempt history">
      <h2>Attempt History ({total})</h2>
      {entries.length === 0 ? (
        <p>No attempts found</p>
      ) : (
        <table>
          <caption>Recent attempts</caption>
          <thead>
            <tr>
              <th>Task</th>
              <th>Date</th>
              <th>Score</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.attemptId}>
                <td>{e.taskType}</td>
                <td>
                  <time dateTime={e.submittedAt}>{e.submittedAt}</time>
                </td>
                <td>Estimated training result: {e.estimatedScore.toFixed(2)}</td>
                <td>{e.resultState}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
