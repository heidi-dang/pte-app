'use client';

import { useState, useEffect, use } from 'react';
import { Container, Card, Button, Badge, EmptyState } from '@pte-app/design-system';
import { api } from '@/lib/phase-h-client';
import { MOCK_COURSES, getLessonsForCourse } from '@/lib/mock-data';

export default function CourseDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [enrolling, setEnrolling] = useState(false);
  const [usingMock, setUsingMock] = useState(false);

  function loadCourse() {
    setLoading(true);
    setError('');
    api
      .getCourse(slug)
      .then((d) => {
        setData(d);
        setUsingMock(false);
      })
      .catch((err) => {
        setError(err.message);
        // Fallback to mock data
        const mockCourse = MOCK_COURSES.find((c) => c.slug === slug);
        if (mockCourse) {
          setData({
            course: mockCourse,
            modules: [{ id: 'm-1', title: 'Course module', lessons: getLessonsForCourse(mockCourse.id) }],
            enrolment: { status: 'active' },
          });
          setUsingMock(true);
        }
      })
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
  if (error && !usingMock)
    return (
      <Container>
        <p data-testid="course-error">{error}</p>
      </Container>
    );
  if (!data?.course)
    return (
      <Container>
        <EmptyState icon="📚" title="Course not found" description="The course you are looking for does not exist." />
      </Container>
    );

  const { course, modules, enrolment } = data;
  const isEnrolled = enrolment?.status === 'active';

  return (
    <main>
      <Container>
        <h1 data-testid="course-title" className="app-page-header__title" style={{ marginBottom: '0.5rem' }}>
          {course.title}
        </h1>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <Badge variant={course.accessLevel === 'free' ? 'success' : 'warning'}>{course.accessLevel}</Badge>
          <Badge>{course.difficulty}</Badge>
          <span style={{ fontSize: '0.875rem', color: 'var(--color-muted)' }}>
            {course.estimatedDurationMinutes} min
          </span>
        </div>
        <p style={{ marginBottom: '1.5rem', color: 'var(--color-text)', lineHeight: '1.6' }}>{course.description}</p>

        {!isEnrolled ? (
          <Button
            data-testid="btn-enrol"
            disabled={enrolling}
            onClick={() => {
              setEnrolling(true);
              if (usingMock) {
                setData({ ...data, enrolment: { status: 'active' } });
                setEnrolling(false);
              } else {
                api
                  .enrol(course.id)
                  .then(loadCourse)
                  .catch(() => setEnrolling(false));
              }
            }}
          >
            {enrolling ? 'Enrolling...' : 'Enrol Now'}
          </Button>
        ) : (
          <Button
            data-testid="btn-resume"
            onClick={() => {
              if (usingMock) {
                const lessons = getLessonsForCourse(course.id);
                const next = lessons.find((l) => l.progress < 100) || lessons[0];
                if (next) window.location.href = `/learn/lessons/${next.id}`;
              } else {
                api.resumeProgress(course.id).then((r) => {
                  if (r.lessonId) window.location.href = `/learn/lessons/${r.lessonId}`;
                });
              }
            }}
          >
            Resume / Start
          </Button>
        )}

        <h2 className="app-section__title" style={{ marginTop: '2rem' }}>
          Modules
        </h2>
        {(modules || []).map((mod: any, mi: number) => (
          <Card key={mod.id} style={{ marginBottom: '1rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>
              Module {mi + 1}: {mod.title}
            </h3>
            {(mod.lessons || []).map((les: any) => (
              <div
                key={les.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.75rem 0',
                  borderBottom: '1px solid var(--color-border)',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <span style={{ fontWeight: 500 }}>{les.title}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>{les.durationMinutes} min</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {les.isOptional && <Badge variant="warning">Optional</Badge>}
                  {les.completed && <Badge variant="success">Completed</Badge>}
                  {isEnrolled && (
                    <Button
                      size="sm"
                      onClick={() => {
                        window.location.href = `/learn/lessons/${les.id}`;
                      }}
                    >
                      {les.completed ? 'Review' : 'Start'}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </Card>
        ))}

        <div style={{ marginTop: '1.5rem' }}>
          <a href="/learn/catalogue" style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>
            Back to catalogue
          </a>
        </div>
      </Container>
    </main>
  );
}
