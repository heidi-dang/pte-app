'use client';

import { useState, useEffect } from 'react';
import { Container, Card, Input, Badge, Button } from '@pte-app/design-system';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

function debounce<T extends (...args: unknown[]) => void>(fn: T, ms: number): T {
  let timer: ReturnType<typeof setTimeout>;
  return ((...args: unknown[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  }) as T;
}

export default function CourseCatalogue() {
  const [courses, setCourses] = useState<Array<Record<string, unknown>>>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const doFetch = () => {
      setLoading(true);
      setError('');
      fetch(`${API_URL}/learn/catalogue?search=${encodeURIComponent(search)}`, {
        credentials: 'include',
        signal: controller.signal,
      })
        .then((res) => {
          if (!res.ok) throw new Error('Failed to load');
          return res.json();
        })
        .then((data) => {
          if (!active) return;
          setCourses(
            (data as { courses?: Array<Record<string, unknown>> }).courses ||
              (data as Array<Record<string, unknown>>) ||
              [],
          );
        })
        .catch((err) => {
          if (!active) return;
          if (err.name === 'AbortError') return;
          setError(err instanceof Error ? err.message : 'Load failed');
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    };
    const debouncedFetch = debounce(doFetch, 300);
    debouncedFetch();
    return () => {
      active = false;
      controller.abort();
    };
  }, [search]);

  return (
    <main style={{ paddingTop: '3rem', paddingBottom: '3rem' }}>
      <Container>
        <h1 style={{ marginBottom: '1.5rem' }}>Course Catalogue</h1>
        <div style={{ marginBottom: '1.5rem' }}>
          <Input
            data-testid="catalogue-search"
            placeholder="Search courses..."
            value={search}
            onChange={(e: { target: { value: string } }) => setSearch(e.target.value)}
            aria-label="Search courses"
          />
        </div>
        {loading && (
          <div
            data-testid="catalogue-loading"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}
          >
            {[1, 2, 3].map((i) => (
              <Card key={i} style={{ minHeight: '120px', opacity: 0.5 }}>
                <p>Loading...</p>
              </Card>
            ))}
          </div>
        )}
        {error && (
          <div data-testid="catalogue-error" style={{ marginBottom: '1rem' }}>
            <p style={{ color: 'var(--color-error, red)' }}>{error}</p>
            <Button data-testid="catalogue-retry" onClick={() => setSearch((s) => s + '')}>
              Retry
            </Button>
          </div>
        )}
        {!loading && !error && courses.length === 0 && <p data-testid="catalogue-empty">No courses found.</p>}
        {!loading && !error && courses.length > 0 && (
          <div
            data-testid="catalogue-grid"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}
          >
            {courses.map((c) => (
              <a
                key={c.id as string}
                href={`/learn/courses/${c.slug as string}`}
                style={{ textDecoration: 'none' }}
                data-testid="course-card"
              >
                <Card style={{ height: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <Badge variant={c.accessLevel === 'free' ? 'success' : 'warning'}>{c.accessLevel as string}</Badge>
                    <Badge>{c.difficulty as string}</Badge>
                  </div>
                  <h2 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>{c.title as string}</h2>
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-muted)' }}>{(c.summary as string) || ''}</p>
                  <p style={{ fontSize: '0.75rem', marginTop: '0.5rem', color: 'var(--color-muted)' }}>
                    {c.estimatedDurationMinutes as number} min
                  </p>
                </Card>
              </a>
            ))}
          </div>
        )}
      </Container>
    </main>
  );
}
