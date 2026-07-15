'use client';

import { useState, useEffect } from 'react';
import { Container, Card, Input, Badge } from '@pte-app/design-system';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function CourseCatalogue() {
  const [courses, setCourses] = useState<Array<Record<string, unknown>>>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/learn/catalogue?search=${encodeURIComponent(search)}`, { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to load');
        const data = await res.json();
        setCourses((data as { courses?: Array<Record<string, unknown>> }).courses || (data as Array<Record<string, unknown>>) || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Load failed');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [search]);

  return (
    <main style={{ paddingTop: '3rem', paddingBottom: '3rem' }}>
      <Container>
        <h1 style={{ marginBottom: '1.5rem' }}>Course Catalogue</h1>
        <div style={{ marginBottom: '1rem' }}>
          <Input
            data-testid="catalogue-search"
            placeholder="Search courses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search courses"
          />
        </div>
        {error && <p style={{ color: 'var(--color-danger)' }} data-testid="catalogue-error">{error}</p>}
        {loading ? (
          <p data-testid="catalogue-loading">Loading courses...</p>
        ) : courses.length === 0 ? (
          <Card data-testid="catalogue-empty">
            <p style={{ color: 'var(--color-muted)' }}>No courses found.</p>
          </Card>
        ) : (
          <div data-testid="catalogue-list" style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
            {courses.map((c) => (
              <Card key={c.id as string} data-testid={`course-card-${c.slug}`}>
                <h2 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                  <a href={`/learn/courses/${c.slug}`} style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>
                    {c.title as string}
                  </a>
                </h2>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-muted)', marginBottom: '0.5rem' }}>{c.summary as string}</p>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <Badge variant={(c.accessLevel as string) === 'free' ? 'success' : 'warning'}>
                    {c.accessLevel as string}
                  </Badge>
                  <Badge variant="default">{c.difficulty as string}</Badge>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>
                    {(c.estimatedDurationMinutes as number)} min
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Container>
    </main>
  );
}
