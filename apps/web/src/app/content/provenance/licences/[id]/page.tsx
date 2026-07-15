'use client';

import { useState, useEffect, use } from 'react';
import { Container, Card, Badge, Button, Alert } from '@pte-app/design-system';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface LicenceDetail {
  id: string;
  licenceType: string;
  licensor: string;
  licensee: string;
  status: string;
  version: number;
}

export default function LicenceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [licence, setLicence] = useState<LicenceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API_URL}/content-provenance/licences/${id}`, { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to load licence');
        setLicence(await res.json());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Load failed');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  async function doAction(action: string) {
    setActionError('');
    setActionSuccess('');
    try {
      const res = await fetch(`${API_URL}/content-provenance/licences/${id}/${action}`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || `Action ${action} failed`);
      setActionSuccess(`${action} completed.`);
      setLicence(data);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : `${action} failed`);
    }
  }

  if (loading)
    return (
      <Container>
        <p>Loading...</p>
      </Container>
    );
  if (error)
    return (
      <Container>
        <Alert>{error}</Alert>
      </Container>
    );
  if (!licence)
    return (
      <Container>
        <Alert>Licence not found</Alert>
      </Container>
    );

  return (
    <main style={{ paddingTop: '3rem', paddingBottom: '3rem' }}>
      <Container>
        <h1 style={{ marginBottom: '1.5rem' }}>
          Licence <span data-testid="licence-id-display">#{licence.id}</span>
        </h1>
        {actionError && <Alert>{actionError}</Alert>}
        {actionSuccess && <Alert>{actionSuccess}</Alert>}
        <Card data-testid="licence-detail-card">
          <dl style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: '0.5rem' }}>
            <dt style={{ fontWeight: 600 }}>ID:</dt>
            <dd data-testid="licence-id-value">{licence.id}</dd>
            <dt style={{ fontWeight: 600 }}>Type:</dt>
            <dd data-testid="licence-type-value">{licence.licenceType}</dd>
            <dt style={{ fontWeight: 600 }}>Licensor:</dt>
            <dd data-testid="licence-licensor-value">{licence.licensor}</dd>
            <dt style={{ fontWeight: 600 }}>Status:</dt>
            <dd data-testid="licence-status-value">
              <Badge
                variant={licence.status === 'revoked' ? 'danger' : licence.status === 'active' ? 'success' : 'default'}
              >
                {licence.status}
              </Badge>
            </dd>
          </dl>
        </Card>
        <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
          {licence.status === 'active' && (
            <Button variant="danger" data-testid="btn-revoke-licence" onClick={() => doAction('revoke')}>
              Revoke Licence
            </Button>
          )}
        </div>
        <div style={{ marginTop: '1rem' }}>
          <a href="/content/provenance/licences" style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>
            Back to licences
          </a>
        </div>
      </Container>
    </main>
  );
}
