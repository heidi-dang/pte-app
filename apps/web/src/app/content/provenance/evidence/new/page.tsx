'use client';

import { useState } from 'react';
import { Container, Card, Input, Button, Alert } from '@pte-app/design-system';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function NewEvidenceForm() {
  const [evidenceType, setEvidenceType] = useState('signed_agreement');
  const [fileName, setFileName] = useState('');
  const [mediaId, setMediaId] = useState('');
  const [checksum, setChecksum] = useState('');
  const [mimeType, setMimeType] = useState('');
  const [description, setDescription] = useState('');
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
      const res = await fetch(`${API_URL}/content-provenance/evidence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          evidenceType,
          fileName,
          mediaId: mediaId || `media-${Date.now()}`,
          checksum,
          mimeType,
          description,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || 'Failed to create evidence');
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
        <h1 style={{ marginBottom: '1.5rem' }}>Attach Evidence</h1>
        {error && <Alert>{error}</Alert>}
        {success && (
          <Alert>
            Evidence created. ID: <span data-testid="evidence-created-id">{createdId}</span>
          </Alert>
        )}
        <Card>
          <form onSubmit={handleSubmit} data-testid="evidence-form">
            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="evidenceType">Evidence Type</label>
              <select
                id="evidenceType"
                data-testid="evidence-type-select"
                value={evidenceType}
                onChange={(e) => setEvidenceType(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
                required
              >
                <option value="signed_agreement">Signed Agreement</option>
                <option value="licence_document">Licence Document</option>
                <option value="contributor_declaration">Contributor Declaration</option>
                <option value="original_draft">Original Draft</option>
                <option value="source_screenshot">Source Screenshot</option>
                <option value="public_domain_evidence">Public Domain Evidence</option>
                <option value="open_licence_evidence">Open Licence Evidence</option>
                <option value="attribution_evidence">Attribution Evidence</option>
              </select>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="fileName">File Name</label>
              <Input
                id="fileName"
                data-testid="evidence-filename-input"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="document.pdf"
                required
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="mediaId">Media ID</label>
              <Input
                id="mediaId"
                data-testid="evidence-media-id-input"
                value={mediaId}
                onChange={(e) => setMediaId(e.target.value)}
                placeholder="media-id"
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="checksum">Checksum</label>
              <Input
                id="checksum"
                data-testid="evidence-checksum-input"
                value={checksum}
                onChange={(e) => setChecksum(e.target.value)}
                placeholder="sha256:abc123"
                required
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="mimeType">MIME Type</label>
              <Input
                id="mimeType"
                data-testid="evidence-mime-input"
                value={mimeType}
                onChange={(e) => setMimeType(e.target.value)}
                placeholder="application/pdf"
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="description">Description</label>
              <Input
                id="description"
                data-testid="evidence-description-input"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description"
              />
            </div>
            <Button type="submit" data-testid="evidence-submit-btn" disabled={submitting}>
              {submitting ? 'Creating...' : 'Attach Evidence'}
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
