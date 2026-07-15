'use client';
import React from 'react';
interface Props {
  provenance: {
    sourceType: string;
    licenceStatus: string;
    creatorDeclaration: string;
    reviewerConfirmation: boolean;
  } | null;
  loading?: boolean;
}
export function ProvenancePanel({ provenance, loading }: Props) {
  if (loading)
    return (
      <section aria-label="Provenance">
        <p>Loading...</p>
      </section>
    );
  if (!provenance)
    return (
      <section aria-label="Provenance">
        <p role="alert">No provenance record</p>
      </section>
    );
  return (
    <section aria-label="Provenance">
      <h2>Provenance</h2>
      <dl>
        <dt>Source</dt>
        <dd>{provenance.sourceType}</dd>
        <dt>Licence</dt>
        <dd>{provenance.licenceStatus}</dd>
        <dt>Declaration</dt>
        <dd>{provenance.creatorDeclaration || 'Missing'}</dd>
        <dt>Reviewer Confirmed</dt>
        <dd>{provenance.reviewerConfirmation ? 'Yes' : 'No'}</dd>
      </dl>
    </section>
  );
}
