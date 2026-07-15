'use client';

import { useState, useEffect } from 'react';
import { Container, Card, Badge } from '@pte-app/design-system';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface QueueItem {
  id: string;
  contentId: string;
  contentVersionId: string;
  verificationStatus: string;
  attribution: string;
}

export default function ReviewQueuePage() {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API_URL}/content-provenance/records`, { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to load');
        const data = (await res.json()) as QueueItem[];
        setItems(
          (data || []).filter((r) => r.verificationStatus === 'submitted' || r.verificationStatus === 'under_review'),
        );
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
        <p>Loading review queue...</p>
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
        <h1 style={{ marginBottom: '1.5rem' }}>Review Queue</h1>
        <p style={{ color: 'var(--color-muted)', marginBottom: '1rem' }}>Items awaiting review.</p>
        <Card data-testid="review-queue-list">
          {items.length === 0 ? (
            <div data-testid="review-queue-empty" style={{ padding: '1rem' }}>
              <p style={{ color: 'var(--color-muted)' }}>No items currently in the review queue.</p>
            </div>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {items.map((item) => (
                <li key={item.id} style={{ padding: '0.75rem', borderBottom: '1px solid var(--color-border)' }}>
                  <a
                    href={`/content/provenance/records/${item.id}`}
                    data-testid={`review-item-${item.id}`}
                    style={{ color: 'var(--color-primary)', textDecoration: 'none' }}
                  >
                    <strong>{item.contentId}</strong>
                  </a>
                  <span style={{ marginLeft: '0.5rem' }}>
                    <Badge variant="warning">{item.verificationStatus}</Badge>
                  </span>
                  <span style={{ marginLeft: '0.5rem', fontSize: '0.875rem', color: 'var(--color-muted)' }}>
                    {item.attribution}
                  </span>
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
