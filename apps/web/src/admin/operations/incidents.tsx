'use client';
import React from 'react';
interface Props {
  incidents: Array<{ id: string; severity: string; status: string; affectedCapability: string; startedAt: string }>;
  onSelect: (id: string) => void;
}
export function Incidents({ incidents, onSelect }: Props) {
  return (
    <section aria-label="Incidents">
      <h2>Incidents</h2>
      {incidents.length === 0 ? (
        <p>No incidents</p>
      ) : (
        <ul>
          {incidents.map((i) => (
            <li key={i.id}>
              {i.severity} — {i.affectedCapability} ({i.status}) <button onClick={() => onSelect(i.id)}>View</button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
