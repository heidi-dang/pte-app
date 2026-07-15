'use client';

import { useState, useEffect } from 'react';
import { Container, Card, Badge } from '@pte-app/design-system';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface ReVerJob {
  id: string;
  provenanceId: string;
  reason: string;
  status: string;
  createdAt: string;
}

export default function ReVerificationPage() {
  const [jobs, setJobs] = useState<ReVerJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API_URL}/content-provenance/reverification`, { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to load');
        setJobs((await res.json()) as ReVerJob[]);
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
        <p>Loading re-verification queue...</p>
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
        <h1 style={{ marginBottom: '1.5rem' }}>Re-verification Queue</h1>
        <p style={{ color: 'var(--color-muted)', marginBottom: '1rem' }}>Items requiring re-verification.</p>
        <Card data-testid="reverification-queue-list">
          {jobs.length === 0 ? (
            <div data-testid="reverification-queue-empty" style={{ padding: '1rem' }}>
              <p style={{ color: 'var(--color-muted)' }}>No items awaiting re-verification.</p>
            </div>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {jobs.map((job) => (
                <li key={job.id} style={{ padding: '0.75rem', borderBottom: '1px solid var(--color-border)' }}>
                  <strong data-testid={`rv-job-${job.id}`}>{job.provenanceId}</strong>
                  <span style={{ marginLeft: '0.5rem' }}>
                    <Badge variant={job.status === 'pending' ? 'warning' : 'default'}>{job.status}</Badge>
                  </span>
                  <div style={{ fontSize: '0.875rem', color: 'var(--color-muted)' }}>{job.reason}</div>
                </li>
              ))}
            </ul>
          )}
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
