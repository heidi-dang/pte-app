'use client';

import { useState, useEffect } from 'react';
import { Container, Card } from '@pte-app/design-system';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function ReportsPage() {
  const [report, setReport] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API_URL}/content-provenance/audit-report`, { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to load');
        setReport((await res.json()) as Record<string, unknown>);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Load failed');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading)
    return (
      <Container>
        <p>Loading audit report...</p>
      </Container>
    );
  if (error)
    return (
      <Container>
        <p style={{ color: 'var(--color-danger)' }}>{error}</p>
      </Container>
    );

  return (
    <main style={{ paddingTop: '3rem', paddingBottom: '3rem' }}>
      <Container>
        <h1 style={{ marginBottom: '1.5rem' }}>Audit Reports</h1>
        <Card data-testid="audit-report">
          <div data-testid="audit-sequence" style={{ padding: '1rem' }}>
            {report ? (
              <>
                <p>
                  <strong>Generated:</strong> {report.generatedAt as string}
                </p>
                <p>
                  <strong>Policy Version:</strong> {report.policyVersion as string}
                </p>
                <p>
                  <strong>Pending Reviews:</strong> {report.pendingReviews as number}
                </p>
                <ul>
                  {((report.historicalChanges as string[]) || []).map((change, i) => (
                    <li key={i}>{change}</li>
                  ))}
                </ul>
              </>
            ) : (
              <p style={{ color: 'var(--color-muted)' }}>No report data available.</p>
            )}
          </div>
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
