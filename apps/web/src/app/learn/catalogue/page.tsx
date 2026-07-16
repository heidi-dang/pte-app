'use client';

import { useState, useEffect } from 'react';
import { Container, Card, Input, Badge, Button, EmptyState } from '@pte-app/design-system';
import { api } from '@/lib/phase-h-client';
import { MOCK_COURSES } from '@/lib/mock-data';

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
  const [retryKey, setRetryKey] = useState(0);
  const [usingMock, setUsingMock] = useState(false);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const doFetch = () => {
      setLoading(true);
      setError('');
      api
        .catalogue({ search: search || undefined, signal: controller.signal })
        .then((data) => {
          if (!active) return;
          const apiCourses = (data as { courses?: Array<Record<string, unknown>> }).courses || [];
          setCourses(apiCourses);
          setUsingMock(false);
        })
        .catch((err) => {
          if (!active) return;
          if (err.name === 'AbortError') return;
          // Fallback to mock data so the catalogue remains demo-ready without backend.
          const term = search.toLowerCase();
          const filtered = MOCK_COURSES.filter(
            (c) =>
              c.title.toLowerCase().includes(term) ||
              c.summary.toLowerCase().includes(term) ||
              c.tags.some((t) => t.toLowerCase().includes(term)),
          );
          setCourses(
            filtered.map((c) => ({ ...c, id: c.id, slug: c.slug })) as unknown as Array<Record<string, unknown>>,
          );
          setUsingMock(true);
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
  }, [search, retryKey]);

  function handleRetry() {
    setRetryKey((k) => k + 1);
  }

  return (
    <main>
      <Container>
        <h1 className="app-page-header__title" style={{ marginBottom: '0.5rem' }}>
          Course catalogue
        </h1>
        <p className="app-page-header__subtitle" style={{ marginBottom: '1.5rem' }}>
          Browse courses, lessons, and practice tracks to reach your target PTE score.
        </p>
        {usingMock && (
          <div style={{ marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.875rem', color: 'var(--color-muted)' }}>
              Showing demo courses. Backend unavailable.
            </span>
            <Button onClick={handleRetry} variant="secondary" size="sm" style={{ marginLeft: '0.75rem' }}>
              Retry backend
            </Button>
          </div>
        )}
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
              <Card key={i} style={{ minHeight: '120px' }}>
                <div
                  style={{
                    height: '1rem',
                    width: '60%',
                    background: 'var(--color-border)',
                    borderRadius: '0.25rem',
                    marginBottom: '0.75rem',
                  }}
                />
                <div
                  style={{
                    height: '0.75rem',
                    width: '100%',
                    background: 'var(--color-border)',
                    borderRadius: '0.25rem',
                    marginBottom: '0.5rem',
                  }}
                />
                <div
                  style={{
                    height: '0.75rem',
                    width: '40%',
                    background: 'var(--color-border)',
                    borderRadius: '0.25rem',
                  }}
                />
              </Card>
            ))}
          </div>
        )}
        {error && !usingMock && (
          <div data-testid="catalogue-error" style={{ marginBottom: '1rem' }}>
            <p style={{ color: 'var(--color-error, red)' }}>{error}</p>
            <Button data-testid="catalogue-retry" onClick={handleRetry}>
              Retry
            </Button>
          </div>
        )}
        {!loading && !error && courses.length === 0 && (
          <EmptyState
            data-testid="catalogue-empty"
            icon="📚"
            title="No courses found"
            description="Try adjusting your search or browse all courses."
          />
        )}
        {!loading && courses.length > 0 && (
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
                <Card
                  style={{ height: '100%', transition: 'transform 150ms ease, box-shadow 150ms ease' }}
                  className="course-card"
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <Badge variant={c.accessLevel === 'free' ? 'success' : 'warning'}>{c.accessLevel as string}</Badge>
                    <Badge>{c.difficulty as string}</Badge>
                  </div>
                  <h2 style={{ fontSize: '1.1rem', marginBottom: '0.25rem', color: 'var(--color-text)' }}>
                    {c.title as string}
                  </h2>
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-muted)' }}>{(c.summary as string) || ''}</p>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                    {((c.tags as string[]) || []).slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        style={{
                          fontSize: '0.75rem',
                          color: 'var(--color-muted)',
                          background: 'var(--color-surface)',
                          padding: '0.125rem 0.5rem',
                          borderRadius: '9999px',
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <p style={{ fontSize: '0.75rem', marginTop: '0.75rem', color: 'var(--color-muted)' }}>
                    {c.estimatedDurationMinutes as number} min · {c.lessons as number} lessons
                  </p>
                </Card>
              </a>
            ))}
          </div>
        )}
      </Container>
      <style>{`
        .course-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px var(--color-shadow);
        }
      `}</style>
    </main>
  );
}
