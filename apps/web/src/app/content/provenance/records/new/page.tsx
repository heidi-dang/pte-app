'use client';

import { useState } from 'react';
import { Container, Card, Input, Button, Alert } from '@pte-app/design-system';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function NewRecordForm() {
  const [contentId, setContentId] = useState('');
  const [contentVersionId, setContentVersionId] = useState('');
  const [sourceId, setSourceId] = useState('');
  const [licenceId, setLicenceId] = useState('');
  const [ownershipType, setOwnershipType] = useState('platform_original');
  const [attribution, setAttribution] = useState('');
  const [evidenceIds, setEvidenceIds] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [createdId, setCreatedId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        contentId,
        contentVersionId,
        sourceId,
        ownershipType,
        attribution,
        evidenceIds: evidenceIds
          ? evidenceIds
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean)
          : [],
      };
      if (licenceId) body.licenceId = licenceId;
      const res = await fetch(`${API_URL}/content-provenance/records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || 'Failed to create record');
      setSuccess(true);
      setCreatedId(data.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main style={{ paddingTop: '3rem', paddingBottom: '3rem' }}>
      <Container>
        <h1 style={{ marginBottom: '1.5rem' }}>Create Provenance Record</h1>
        {error && <Alert>{error}</Alert>}
        {success && (
          <Alert>
            Record created.{' '}
            <a href={`/content/provenance/records/${createdId}`} data-testid="view-record-link">
              View record
            </a>
          </Alert>
        )}
        <Card>
          <form onSubmit={handleSubmit} data-testid="provenance-form">
            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="contentId">Content ID</label>
              <Input
                id="contentId"
                data-testid="prov-content-id-input"
                value={contentId}
                onChange={(e) => setContentId(e.target.value)}
                placeholder="content-001"
                required
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="contentVersionId">Content Version ID</label>
              <Input
                id="contentVersionId"
                data-testid="prov-version-id-input"
                value={contentVersionId}
                onChange={(e) => setContentVersionId(e.target.value)}
                placeholder="v1"
                required
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="sourceId">Source ID</label>
              <Input
                id="sourceId"
                data-testid="prov-source-id-input"
                value={sourceId}
                onChange={(e) => setSourceId(e.target.value)}
                placeholder="source-uuid"
                required
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="licenceId">Licence ID (optional)</label>
              <Input
                id="licenceId"
                data-testid="prov-licence-id-input"
                value={licenceId}
                onChange={(e) => setLicenceId(e.target.value)}
                placeholder="licence-uuid"
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="ownershipType">Ownership Type</label>
              <select
                id="ownershipType"
                data-testid="prov-ownership-select"
                value={ownershipType}
                onChange={(e) => setOwnershipType(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
                required
              >
                <option value="platform_original">Platform Original</option>
                <option value="commissioned">Commissioned</option>
                <option value="contributor_owned">Contributor Owned</option>
                <option value="licensed">Licensed</option>
                <option value="public_domain">Public Domain</option>
                <option value="open_licence">Open Licence</option>
                <option value="authorised_reference">Authorised Reference</option>
              </select>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="attribution">Attribution</label>
              <Input
                id="attribution"
                data-testid="prov-attribution-input"
                value={attribution}
                onChange={(e) => setAttribution(e.target.value)}
                placeholder="Attribution text"
                required
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="evidenceIds">Evidence IDs (comma-separated)</label>
              <Input
                id="evidenceIds"
                data-testid="prov-evidence-ids-input"
                value={evidenceIds}
                onChange={(e) => setEvidenceIds(e.target.value)}
                placeholder="uuid1, uuid2"
              />
            </div>
            <Button type="submit" data-testid="prov-submit-btn" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Record'}
            </Button>
          </form>
        </Card>
        <div style={{ marginTop: '1rem' }}>
          <a href="/content/provenance" style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>
            Back to dashboard
          </a>
        </div>
      </Container>
    </main>
  );
}
