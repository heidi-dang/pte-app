'use client';

import { useState } from 'react';
import { Container, Card, Input, Button, Alert, Badge } from '@pte-app/design-system';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export default function PublicationCheckPage() {
  const [contentId, setContentId] = useState('');
  const [contentVersionId, setContentVersionId] = useState('');
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);

  async function handleCheck(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setResult(null);
    setChecking(true);
    try {
      const res = await fetch(`${API_URL}/content-provenance/publication-check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ contentId, contentVersionId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || 'Check failed');
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setChecking(false);
    }
  }

  return (
    <main style={{ paddingTop: '3rem', paddingBottom: '3rem' }}>
      <Container>
        <h1 style={{ marginBottom: '1.5rem' }}>Publication Check</h1>
        {error && <Alert data-testid="pub-check-error">{error}</Alert>}
        {checking && <p data-testid="pub-check-loading">Checking publication eligibility...</p>}
        <Card>
          <form onSubmit={handleCheck} data-testid="publication-check-form">
            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="contentId">Content ID</label>
              <Input
                id="contentId"
                data-testid="pub-check-content-id"
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
                data-testid="pub-check-version-id"
                value={contentVersionId}
                onChange={(e) => setContentVersionId(e.target.value)}
                placeholder="v1"
                required
              />
            </div>
            <Button type="submit" data-testid="pub-check-submit-btn" disabled={checking}>
              {checking ? 'Checking...' : 'Check Eligibility'}
            </Button>
          </form>
        </Card>
        {result && (
          <Card style={{ marginTop: '1rem' }} data-testid="pub-check-result">
            <h2>Result</h2>
            <div style={{ marginTop: '0.5rem' }}>
              <Badge variant={result.eligible ? 'success' : 'danger'} data-testid="pub-check-eligible">
                {result.eligible ? 'Eligible' : 'Blocked'}
              </Badge>
            </div>
            {(result.blockers as Array<{ code: string; message: string }>)?.length > 0 && (
              <div data-testid="pub-check-blockers" style={{ marginTop: '0.5rem' }}>
                <strong>Blockers:</strong>
                <ul>
                  {(result.blockers as Array<{ code: string }>).map((b, i) => (
                    <li key={i} data-testid={`blocker-${b.code}`}>
                      {b.code}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>
        )}
        <div style={{ marginTop: '1rem' }}>
          <a href="/content/provenance" style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>
            Back to dashboard
          </a>
        </div>
      </Container>
    </main>
  );
}
