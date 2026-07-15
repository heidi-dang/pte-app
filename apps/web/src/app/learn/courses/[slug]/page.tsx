'use client';

import { useState, useEffect, use } from 'react';
import { Container, Card, Button, Badge } from '@pte-app/design-system';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function CourseDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/learn/courses/${slug}`, { credentials: 'include' });
        if (!res.ok) throw new Error('Not found');
        setData(await res.json());
      } catch (err: any) {
        setError(err.message || 'Not found');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  async function enrol() {
    if (!data?.course?.id) return;
    try {
      const res = await fetch(`${API_URL}/learn/courses/${data.course.id}/enrol`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Enrolment failed');
      setData({ ...data, enrolment: await res.json() });
    } catch (err: any) {
      setError(err.message);
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
        <p style={{ color: 'var(--color-danger)' }}>{error}</p>
      </Container>
    );
  if (!data?.course)
    return (
      <Container>
        <p>Course not found</p>
      </Container>
    );

  const c = data.course;
  return (
    <main style={{ paddingTop: '3rem', paddingBottom: '3rem' }}>
      <Container>
        <h1>{c.title}</h1>
        <p>{c.summary}</p>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          <Badge variant={c.accessLevel === 'free' ? 'success' : 'warning'}>{c.accessLevel}</Badge>
          <Badge variant="default">{c.difficulty}</Badge>
        </div>
        {!data.enrolment && (
          <Button data-testid="btn-enrol" onClick={enrol}>
            Enrol Now
          </Button>
        )}
        {data.enrolment && <Badge variant="success">Enrolled</Badge>}
        {data.modules &&
          data.modules.map((m: any) => (
            <Card key={m.id} style={{ marginBottom: '1rem', marginTop: '1rem' }}>
              <h3>{m.title}</h3>
              {m.lessons &&
                m.lessons.map((l: any) => (
                  <div key={l.id} style={{ padding: '0.25rem 0' }}>
                    <a href={`/learn/lessons/${l.id}`} style={{ color: 'var(--color-primary)' }}>
                      {l.title}
                    </a>
                  </div>
                ))}
            </Card>
          ))}
        <a href="/learn/catalogue">Back to catalogue</a>
      </Container>
    </main>
  );
}
