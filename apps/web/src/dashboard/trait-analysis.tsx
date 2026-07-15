'use client';
import React from 'react';

interface TraitAnalysisProps {
  traits: Array<{ traitId: string; traitName: string; score: number; evidenceType: string }>;
  missingTraits: string[];
  warnings: string[];
}

export function TraitAnalysis({ traits, missingTraits, warnings }: TraitAnalysisProps) {
  return (
    <section aria-label="Trait-level analysis">
      <h2>Trait Analysis</h2>
      {warnings.map((w, i) => (
        <p key={i} role="alert">
          {w}
        </p>
      ))}
      {traits.length === 0 ? (
        <p>No trait data available</p>
      ) : (
        <table>
          <caption>Trait scores</caption>
          <thead>
            <tr>
              <th>Trait</th>
              <th>Score</th>
              <th>Evidence</th>
            </tr>
          </thead>
          <tbody>
            {traits.map((t) => (
              <tr key={t.traitId}>
                <td>{t.traitName}</td>
                <td>{t.score.toFixed(2)}</td>
                <td>{t.evidenceType}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {missingTraits.length > 0 && <p role="alert">Missing traits: {missingTraits.join(', ')}</p>}
    </section>
  );
}
