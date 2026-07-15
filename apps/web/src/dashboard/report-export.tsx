'use client';
import React from 'react';

interface ReportExportProps {
  formats: string[];
  onExport: (format: string) => void;
  exporting?: boolean;
  error?: string;
}

export function ReportExport({ formats, onExport, exporting, error }: ReportExportProps) {
  return (
    <section aria-label="Export report">
      <h2>Export Report</h2>
      {error && <p role="alert">{error}</p>}
      {formats.length === 0 ? (
        <p>No export formats available</p>
      ) : (
        <ul>
          {formats.map((f) => (
            <li key={f}>
              <button onClick={() => onExport(f)} disabled={exporting} aria-label={`Export as ${f}`}>
                {exporting ? 'Exporting...' : `Export as ${f.toUpperCase()}`}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
