'use client';
import React from 'react';
interface Props {
  datasets: Array<{ id: string; taskType: string; activationStatus: string }>;
  onSelect: (id: string) => void;
}
export function DatasetList({ datasets, onSelect }: Props) {
  return (
    <section aria-label="Calibration datasets">
      <h2>Datasets</h2>
      {datasets.length === 0 ? (
        <p>No datasets</p>
      ) : (
        <ul>
          {datasets.map((d) => (
            <li key={d.id}>
              <button onClick={() => onSelect(d.id)}>
                {d.taskType} ({d.activationStatus})
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
