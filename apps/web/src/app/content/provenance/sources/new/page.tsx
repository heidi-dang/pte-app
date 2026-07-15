'use client';

import { useState } from 'react';
import { Container, Card, Input, Button, Alert } from '@pte-app/design-system';

export default function NewSourceForm() {
  const [sourceType, setSourceType] = useState('original_creation_record');
  const [title, setTitle] = useState('');
  const [owner, setOwner] = useState('');
  const [publisher, setPublisher] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [jurisdiction, setJurisdiction] = useState('');
  const [sourceDate, setSourceDate] = useState('');
  const [accessDate, setAccessDate] = useState('');
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/content-provenance/sources`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          sourceType,
          title,
          owner,
          publisher,
          sourceUrl,
          jurisdiction,
          sourceDate: new Date(sourceDate).toISOString(),
          accessDate: new Date(accessDate).toISOString(),
          description,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || 'Failed to create source');
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
        <h1 style={{ marginBottom: '1.5rem' }}>New Source</h1>
        {error && <Alert data-testid="source-error">{error}</Alert>}
        {success && (
          <Alert data-testid="source-success">
            Source created.{' '}
            <a href={`/content/provenance/sources/${createdId}`} data-testid="view-source-link">
              View source
            </a>
          </Alert>
        )}
        <Card>
          <form onSubmit={handleSubmit} data-testid="source-form">
            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="sourceType">Source Type</label>
              <select
                id="sourceType"
                data-testid="source-type-select"
                value={sourceType}
                onChange={(e) => setSourceType(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
                required
              >
                <option value="original_creation_record">Original Creation Record</option>
                <option value="contributor_declaration">Contributor Declaration</option>
                <option value="licence_agreement">Licence Agreement</option>
                <option value="public_domain_record">Public Domain Record</option>
                <option value="commissioned_work">Commissioned Work</option>
              </select>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="title">Title</label>
              <Input
                id="title"
                data-testid="source-title-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Source title"
                required
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="owner">Owner</label>
              <Input
                id="owner"
                data-testid="source-owner-input"
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                placeholder="Owner name"
                required
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="publisher">Publisher</label>
              <Input
                id="publisher"
                data-testid="source-publisher-input"
                value={publisher}
                onChange={(e) => setPublisher(e.target.value)}
                placeholder="Publisher name"
                required
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="sourceUrl">Source URL</label>
              <Input
                id="sourceUrl"
                data-testid="source-url-input"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                placeholder="https://example.com/source"
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="jurisdiction">Jurisdiction</label>
              <Input
                id="jurisdiction"
                data-testid="source-jurisdiction-input"
                value={jurisdiction}
                onChange={(e) => setJurisdiction(e.target.value)}
                placeholder="AU"
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="sourceDate">Source Date *</label>
              <Input
                id="sourceDate"
                data-testid="source-date-input"
                type="date"
                value={sourceDate}
                onChange={(e) => setSourceDate(e.target.value)}
                required
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="accessDate">Access Date *</label>
              <Input
                id="accessDate"
                data-testid="source-access-date-input"
                type="date"
                value={accessDate}
                onChange={(e) => setAccessDate(e.target.value)}
                required
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="description">Description</label>
              <Input
                id="description"
                data-testid="source-description-input"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description"
              />
            </div>
            <Button type="submit" data-testid="source-submit-btn" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Source'}
            </Button>
          </form>
        </Card>
        <div style={{ marginTop: '1rem' }}>
          <a href="/content/provenance/sources" style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>
            Back to sources
          </a>
        </div>
      </Container>
    </main>
  );
}
