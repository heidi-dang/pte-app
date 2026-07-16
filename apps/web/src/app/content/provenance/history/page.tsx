'use client';

import { useState } from 'react';
import { Container, Card, Input, Button, Alert, Badge } from '@pte-app/design-system';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export default function HistoryPage() {
  const [contentId, setContentId] = useState('');
  const [decisions, setDecisions] = useState<Array<Record<string, unknown>> | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLoad(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setDecisions(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/content-provenance/decisions/${contentId}`, { credentials: 'include' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || 'Load failed');
      setDecisions(Array.isArray(data) ? data : [data]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ paddingTop: '3rem', paddingBottom: '3rem' }}>
      <Container>
        <h1 style={{ marginBottom: '1.5rem' }}>Historical Decisions</h1>
        {error && <Alert>{error}</Alert>}
        <Card>
          <form onSubmit={handleLoad} data-testid="history-form">
            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="contentId">Content ID</label>
              <Input
                id="contentId"
                data-testid="history-content-id"
                value={contentId}
                onChange={(e) => setContentId(e.target.value)}
                placeholder="content-001"
                required
              />
            </div>
            <Button type="submit" data-testid="history-load-btn" disabled={loading}>
              {loading ? 'Loading...' : 'Load Decisions'}
            </Button>
          </form>
        </Card>
        {decisions && (
          <Card style={{ marginTop: '1rem' }} data-testid="history-results">
            <h2>Decisions</h2>
            {decisions.length === 0 ? (
              <p style={{ color: 'var(--color-muted)' }}>No decisions found.</p>
            ) : (
              <ul data-testid="history-decision-list">
                {decisions.map((d, i) => (
                  <li
                    key={i}
                    data-testid={`decision-${i}`}
                    style={{
                      marginBottom: '0.5rem',
                      padding: '0.5rem',
                      border: '1px solid var(--color-border)',
                      borderRadius: '4px',
                    }}
                  >
                    <Badge variant={(d.eligible as boolean) ? 'success' : 'danger'}>
                      {(d.eligible as boolean) ? 'Eligible' : 'Blocked'}
                    </Badge>
                    <span style={{ marginLeft: '0.5rem', fontSize: '0.875rem', color: 'var(--color-muted)' }}>
                      {d.evaluatedAt as string}
                    </span>
                    <div style={{ marginTop: '0.25rem' }}>
                      <small data-testid={`decision-${i}-id`}>ID: {d.id as string}</small>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        )}
        <div style={{ marginTop: '1rem' }}>
          <a href="/content/provenance/reports" style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>
            Audit Reports
          </a>
        </div>
      </Container>
    </main>
  );
}
