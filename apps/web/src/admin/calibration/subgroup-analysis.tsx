'use client';
import React from 'react';

interface SubgroupRow {
  subgroupName: string;
  sampleSize: number;
  meanScore: number;
  disclosed: boolean;
}

interface Props {
  subgroups: SubgroupRow[];
}

export function SubgroupAnalysis({ subgroups }: Props) {
  return (
    <section aria-label="Subgroup analysis">
      <h2>Subgroup Analysis</h2>
      {subgroups.length === 0 ? (
        <p>No subgroup data</p>
      ) : (
        <table>
          <caption>Subgroup results</caption>
          <thead>
            <tr>
              <th>Group</th>
              <th>Size</th>
              <th>Mean</th>
              <th>Disclosed</th>
            </tr>
          </thead>
          <tbody>
            {subgroups.map((s) => (
              <tr key={s.subgroupName}>
                <td>{s.subgroupName}</td>
                <td>{s.sampleSize}</td>
                <td>{s.meanScore.toFixed(3)}</td>
                <td>{s.disclosed ? 'Yes' : 'No'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
