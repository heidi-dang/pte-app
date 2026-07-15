'use client';

import { useState, useEffect, use } from 'react';
import { Container, Card, Button, Badge } from '@pte-app/design-system';
import { api } from '@/lib/phase-h-client';

export default function CourseDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [enrolling, setEnrolling] = useState(false);

  function loadCourse() {
    setLoading(true);
    setError('');
    api
      .getCourse(slug)
      .then((d) => {
        setData(d);
        setError('');
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadCourse();
  }, [slug]);

  if (loading)
    return (
      <Container>
        <p data-testid="course-loading">Loading...</p>
      </Container>
    );
  if (error)
    return (
      <Container>
        <p data-testid="course-error">{error}</p>
      </Container>
    );
  if (!data?.course)
    return (
      <Container>
        <p>Course not found</p>
      </Container>
    );

  const { course, modules, enrolment } = data;
  const isEnrolled = enrolment?.status === 'active';

  return (
    <main style={{ paddingTop: '3rem', paddingBottom: '3rem' }}>
      <Container>
        <h1 data-testid="course-title" style={{ marginBottom: '0.5rem' }}>
          {course.title}
        </h1>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          <Badge variant={course.accessLevel === 'free' ? 'success' : 'warning'}>{course.accessLevel}</Badge>
          <Badge>{course.difficulty}</Badge>
          <span style={{ fontSize: '0.875rem', color: 'var(--color-muted)' }}>
            {course.estimatedDurationMinutes} min
          </span>
        </div>
        <p style={{ marginBottom: '1.5rem' }}>{course.description}</p>

        {!isEnrolled ? (
          <Button
            data-testid="btn-enrol"
            disabled={enrolling}
            onClick={() => {
              setEnrolling(true);
              api
                .enrol(course.id)
                .then(loadCourse)
                .catch(() => setEnrolling(false));
            }}
          >
            {enrolling ? 'Enrolling...' : 'Enrol Now'}
          </Button>
        ) : (
          <Button
            data-testid="btn-resume"
            onClick={() =>
              api.resumeProgress(course.id).then((r) => {
                if (r.lessonId) window.location.href = `/learn/lessons/${r.lessonId}`;
              })
            }
          >
            Resume / Start
          </Button>
        )}

        <h2 style={{ marginTop: '2rem', marginBottom: '1rem' }}>Modules</h2>
        {(modules || []).map((mod: any, mi: number) => (
          <Card key={mod.id} style={{ marginBottom: '1rem', padding: '1rem' }}>
            <h3>
              Module {mi + 1}: {mod.title}
            </h3>
            {(mod.lessons || []).map((les: any) => (
              <div
                key={les.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.5rem 0',
                  borderBottom: '1px solid #eee',
                }}
              >
                <span>
                  {les.title} {les.isOptional && <Badge variant="warning">Optional</Badge>}
                </span>
                {isEnrolled && (
                  <Button
                    onClick={() => {
                      window.location.href = `/learn/lessons/${les.id}`;
                    }}
                  >
                    Start
                  </Button>
                )}
              </div>
            ))}
          </Card>
        ))}
      </Container>
    </main>
  );
}
