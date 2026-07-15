'use client';

import { useState } from 'react';
import { Container, Card, Input, Button, Alert } from '@pte-app/design-system';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function NewLicenceForm() {
  const [licenceType, setLicenceType] = useState('exclusive');
  const [licensor, setLicensor] = useState('');
  const [licensee, setLicensee] = useState('');
  const [validFrom, setValidFrom] = useState('');
  const [jurisdiction, setJurisdiction] = useState('');
  const [commercialUse, setCommercialUse] = useState(true);
  const [modification, setModification] = useState(true);
  const [attribution, setAttribution] = useState(false);
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
      const res = await fetch(`${API_URL}/content-provenance/licences`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          licenceType,
          licensor,
          licensee,
          rightsGranted: ['publication', 'modification'],
          commercialUseAllowed: commercialUse,
          modificationAllowed: modification,
          attributionRequired: attribution,
          validFrom: validFrom ? new Date(validFrom).toISOString().split('T')[0] : '2024-01-01',
          jurisdiction,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || 'Failed to create licence');
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
        <h1 style={{ marginBottom: '1.5rem' }}>New Licence</h1>
        {error && <Alert data-testid="licence-error">{error}</Alert>}
        {success && (
          <Alert data-testid="licence-success">
            Licence created.{' '}
            <a href={`/content/provenance/licences/${createdId}`} data-testid="view-licence-link">
              View licence
            </a>
          </Alert>
        )}
        <Card>
          <form onSubmit={handleSubmit} data-testid="licence-form">
            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="licenceType">Licence Type</label>
              <select
                id="licenceType"
                data-testid="licence-type-select"
                value={licenceType}
                onChange={(e) => setLicenceType(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
                required
              >
                <option value="exclusive">Exclusive</option>
                <option value="non_exclusive">Non-Exclusive</option>
                <option value="open">Open</option>
                <option value="public_domain">Public Domain</option>
                <option value="statutory">Statutory</option>
              </select>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="licensor">Licensor</label>
              <Input
                id="licensor"
                data-testid="licence-licensor-input"
                value={licensor}
                onChange={(e) => setLicensor(e.target.value)}
                placeholder="Licensor name"
                required
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="licensee">Licensee</label>
              <Input
                id="licensee"
                data-testid="licence-licensee-input"
                value={licensee}
                onChange={(e) => setLicensee(e.target.value)}
                placeholder="Licensee name"
                required
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="validFrom">Valid From</label>
              <Input
                id="validFrom"
                data-testid="licence-valid-from-input"
                type="date"
                value={validFrom}
                onChange={(e) => setValidFrom(e.target.value)}
              />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="jurisdiction">Jurisdiction</label>
              <Input
                id="jurisdiction"
                data-testid="licence-jurisdiction-input"
                value={jurisdiction}
                onChange={(e) => setJurisdiction(e.target.value)}
                placeholder="AU"
              />
            </div>
            <div style={{ marginBottom: '0.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <label>
                <input
                  type="checkbox"
                  data-testid="licence-commercial-checkbox"
                  checked={commercialUse}
                  onChange={(e) => setCommercialUse(e.target.checked)}
                />{' '}
                Commercial use allowed
              </label>
              <label>
                <input
                  type="checkbox"
                  data-testid="licence-modification-checkbox"
                  checked={modification}
                  onChange={(e) => setModification(e.target.checked)}
                />{' '}
                Modification allowed
              </label>
              <label>
                <input
                  type="checkbox"
                  data-testid="licence-attribution-checkbox"
                  checked={attribution}
                  onChange={(e) => setAttribution(e.target.checked)}
                />{' '}
                Attribution required
              </label>
            </div>
            <Button type="submit" data-testid="licence-submit-btn" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Licence'}
            </Button>
          </form>
        </Card>
        <div style={{ marginTop: '1rem' }}>
          <a href="/content/provenance/licences" style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>
            Back to licences
          </a>
        </div>
      </Container>
    </main>
  );
}
