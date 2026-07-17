import { redirect } from 'next/navigation';
import { Container, Card, Badge, Button, Table, type TableColumn } from '@pte-app/design-system';
import { MOCK_STUDENTS } from '@/lib/mock-data';
import { getCurrentUser } from '@/lib/auth';

export const metadata = {
  title: 'Teacher Portal — PTE Academy',
  description: 'Teacher portal: manage students, review submissions, and track analytics.',
};

// TODO: Fetch real submissions from backend API
const MOCK_SUBMISSIONS = [
  {
    id: 'sub-1',
    student: 'Alex Johnson',
    task: 'Read Aloud — Science',
    skill: 'Speaking',
    score: 78,
    status: 'graded' as const,
    submittedAt: '2026-07-16T07:30:00Z',
  },
  {
    id: 'sub-2',
    student: 'Priya Sharma',
    task: 'Write Essay — Education',
    skill: 'Writing',
    score: null,
    status: 'pending' as const,
    submittedAt: '2026-07-16T08:15:00Z',
  },
  {
    id: 'sub-3',
    student: 'Wei Chen',
    task: 'Repeat Sentence — Lecture',
    skill: 'Speaking',
    score: null,
    status: 'pending' as const,
    submittedAt: '2026-07-16T09:00:00Z',
  },
  {
    id: 'sub-4',
    student: 'Maria Gonzalez',
    task: 'Summarise Written Text',
    skill: 'Writing',
    score: 65,
    status: 'graded' as const,
    submittedAt: '2026-07-15T14:20:00Z',
  },
  {
    id: 'sub-5',
    student: 'Ahmed Al-Farsi',
    task: 'Describe Image — Graph',
    skill: 'Speaking',
    score: 72,
    status: 'graded' as const,
    submittedAt: '2026-07-15T11:45:00Z',
  },
];

const SIDEBAR_NAV = [
  { label: 'Homework Queue', href: '#submissions', active: true },
  { label: 'Students', href: '#students', active: false },
  { label: 'Custom Tasks', href: '#tasks', active: false },
  { label: 'Analytics', href: '#analytics', active: false },
];

const submissionColumns: TableColumn<(typeof MOCK_SUBMISSIONS)[number]>[] = [
  { key: 'student', header: 'Student', cell: (row) => <span style={{ fontWeight: 500 }}>{row.student}</span> },
  { key: 'task', header: 'Task', cell: (row) => row.task },
  { key: 'skill', header: 'Skill', cell: (row) => <Badge>{row.skill}</Badge> },
  { key: 'score', header: 'Score', cell: (row) => (row.score !== null ? <strong>{row.score}</strong> : '—') },
  {
    key: 'status',
    header: 'Status',
    cell: (row) => (
      <Badge variant={row.status === 'graded' ? 'success' : 'warning'}>
        {row.status === 'graded' ? 'Graded' : 'Pending'}
      </Badge>
    ),
  },
  { key: 'actions', header: '', cell: () => <Button size="sm">Review</Button> },
];

const studentColumns: TableColumn<(typeof MOCK_STUDENTS)[number]>[] = [
  { key: 'name', header: 'Name', cell: (row) => <span style={{ fontWeight: 500 }}>{row.name}</span> },
  { key: 'email', header: 'Email', cell: (row) => <span style={{ color: 'var(--color-muted)' }}>{row.email}</span> },
  {
    key: 'plan',
    header: 'Plan',
    cell: (row) => (
      <Badge variant={row.plan === 'free' ? 'default' : row.plan === 'pro' ? 'warning' : 'success'}>{row.plan}</Badge>
    ),
  },
  { key: 'estimatedScore', header: 'Score', cell: (row) => <strong>{row.estimatedScore}</strong> },
  { key: 'streakDays', header: 'Streak', cell: (row) => `${row.streakDays}d` },
  { key: 'country', header: 'Country', cell: (row) => row.country },
];

export default async function TeacherPortal() {
  const user = await getCurrentUser();
  if (!user || !user.roles.includes('teacher')) {
    redirect('/permission-denied');
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar navigation */}
      <aside
        style={{
          display: 'none',
          width: '14rem',
          flexShrink: 0,
          borderRight: '1px solid var(--color-border)',
          background: 'var(--color-bg)',
          padding: 'var(--space-6) var(--space-4)',
          flexDirection: 'column',
          gap: 'var(--space-2)',
          position: 'sticky',
          top: 0,
          height: '100vh',
        }}
        className="teacher-sidebar"
      >
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text)' }}>
            <span className="ds-gradient-text">Teacher Portal</span>
          </h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-muted)', marginTop: 'var(--space-1)' }}>
            PTE Academy Dashboard
          </p>
        </div>
        {SIDEBAR_NAV.map((item) => (
          <a
            key={item.label}
            href={item.href}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-3)',
              padding: 'var(--space-2) var(--space-3)',
              borderRadius: 'var(--radius-md)',
              color: item.active ? 'var(--color-primary)' : 'var(--color-text)',
              background: item.active ? 'rgba(16, 185, 129, 0.08)' : 'transparent',
              fontSize: '0.875rem',
              fontWeight: item.active ? 600 : 500,
              textDecoration: 'none',
              transition: 'background 150ms ease',
            }}
          >
            {item.label}
          </a>
        ))}
        <div style={{ marginTop: 'auto', paddingTop: 'var(--space-6)' }}>
          <a href="/teacher/analytics">
            <Button variant="secondary" size="sm" style={{ width: '100%' }}>
              View Analytics
            </Button>
          </a>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, minWidth: 0, padding: 'var(--space-6)', overflow: 'auto' }}>
        <Container>
          {/* Page header */}
          <div className="app-page-header" style={{ marginBottom: 'var(--space-8)' }}>
            <div>
              <h1 className="app-page-header__title">
                <span className="ds-gradient-text">Teacher Dashboard</span>
              </h1>
              <p className="app-page-header__subtitle">
                Manage your students, review submissions, and track class performance.
              </p>
            </div>
            <div className="app-page-header__actions">
              <Button variant="secondary">Export Report</Button>
              <Button>Create Custom Task</Button>
            </div>
          </div>

          {/* KPI cards */}
          <div className="app-stat-grid" style={{ marginBottom: 'var(--space-8)' }}>
            <div className="ds-card--premium" style={{ padding: 'var(--space-6)' }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-muted)', marginBottom: 'var(--space-2)' }}>
                Active Students
              </p>
              <p
                style={{
                  fontSize: '2rem',
                  fontWeight: 800,
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--color-text)',
                }}
              >
                {MOCK_STUDENTS.length}
              </p>
            </div>
            <div className="ds-card--premium" style={{ padding: 'var(--space-6)' }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-muted)', marginBottom: 'var(--space-2)' }}>
                Pending Reviews
              </p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-3)' }}>
                <p
                  style={{
                    fontSize: '2rem',
                    fontWeight: 800,
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--color-text)',
                  }}
                >
                  {MOCK_SUBMISSIONS.filter((s) => s.status === 'pending').length}
                </p>
                <Badge variant="warning">Needs attention</Badge>
              </div>
            </div>
            <div className="ds-card--premium" style={{ padding: 'var(--space-6)' }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-muted)', marginBottom: 'var(--space-2)' }}>
                Sessions Today
              </p>
              <p
                style={{
                  fontSize: '2rem',
                  fontWeight: 800,
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--color-text)',
                }}
              >
                5
              </p>
            </div>
            <div className="ds-card--premium" style={{ padding: 'var(--space-6)' }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-muted)', marginBottom: 'var(--space-2)' }}>
                Avg Class Score
              </p>
              <p
                style={{
                  fontSize: '2rem',
                  fontWeight: 800,
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--color-text)',
                }}
              >
                72
              </p>
              <div
                style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}
              >
                <span style={{ color: '#16a34a', fontWeight: 600, fontSize: '0.875rem' }}>↑ 4%</span>
                <span style={{ color: 'var(--color-muted)', fontSize: '0.875rem' }}>vs last week</span>
              </div>
            </div>
          </div>

          {/* Submission queue */}
          <section id="submissions" style={{ marginBottom: 'var(--space-8)' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 'var(--space-4)',
              }}
            >
              <h2 className="app-section__title" style={{ marginBottom: 0 }}>
                Submission Queue
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <span className="ds-pulse-dot" />
                <span
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--color-muted)',
                    fontFamily: 'var(--font-mono)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                  }}
                >
                  Live
                </span>
              </div>
            </div>
            <Table columns={submissionColumns} rows={MOCK_SUBMISSIONS} keyExtractor={(row) => row.id} />
          </section>

          {/* Student roster */}
          <section id="students" style={{ marginBottom: 'var(--space-8)' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 'var(--space-4)',
              }}
            >
              <h2 className="app-section__title" style={{ marginBottom: 0 }}>
                Student Roster
              </h2>
              <Button size="sm">Add Student</Button>
            </div>
            <Table columns={studentColumns} rows={MOCK_STUDENTS} keyExtractor={(row) => row.id} />
          </section>

          {/* Student progress cards */}
          <section style={{ marginBottom: 'var(--space-8)' }}>
            <h2 className="app-section__title">Student Progress</h2>
            <div style={{ display: 'grid', gap: 'var(--space-4)', gridTemplateColumns: 'repeat(1, 1fr)' }}>
              {MOCK_STUDENTS.map((student) => (
                <Card key={student.id}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 'var(--space-3)',
                    }}
                  >
                    <div>
                      <h3
                        style={{
                          fontWeight: 600,
                          fontSize: '1rem',
                          color: 'var(--color-text)',
                          marginBottom: 'var(--space-1)',
                        }}
                      >
                        {student.name}
                      </h3>
                      <p style={{ fontSize: '0.875rem', color: 'var(--color-muted)' }}>
                        Target: {student.targetScore} · Current: {student.estimatedScore} · {student.country}
                      </p>
                    </div>
                    <a href={`/teacher/students/${student.id}`}>
                      <Button size="sm">Review</Button>
                    </a>
                  </div>
                </Card>
              ))}
            </div>
          </section>

          {/* Analytics placeholder */}
          <section id="analytics" style={{ marginBottom: 'var(--space-8)' }}>
            <h2 className="app-section__title">Analytics Overview</h2>
            <Card>
              <div style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
                <p style={{ color: 'var(--color-muted)', fontSize: '1rem' }}>
                  Analytics charts will be displayed here.
                </p>
                <p style={{ color: 'var(--color-muted)', fontSize: '0.875rem', marginTop: 'var(--space-2)' }}>
                  {/* TODO: Connect to real analytics backend endpoint */}
                  Charts: class average trend, skill distribution, submission volume
                </p>
              </div>
            </Card>
          </section>
        </Container>
      </main>

      <style>{`
        @media (min-width: 1024px) {
          .teacher-sidebar {
            display: flex !important;
          }
        }
      `}</style>
    </div>
  );
}
