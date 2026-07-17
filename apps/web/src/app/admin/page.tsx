import { Container, Card, Badge, Button, Table, StatCard, type TableColumn } from '@pte-app/design-system';
import { SUPPORT_TICKETS } from '@/lib/mock-data';

export const metadata = {
  title: 'Admin Portal — PTE Academy',
  description: 'Administration dashboard: manage users, roles, content, and system settings.',
};

// TODO: Fetch real question bank from backend API
const MOCK_QUESTION_BANK = [
  {
    id: 'q-1',
    title: 'Read Aloud — Marine Biology',
    skill: 'Speaking',
    difficulty: 'Medium',
    status: 'active' as const,
    uses: 1240,
  },
  {
    id: 'q-2',
    title: 'Write Essay — Technology & Society',
    skill: 'Writing',
    difficulty: 'Hard',
    status: 'active' as const,
    uses: 892,
  },
  {
    id: 'q-3',
    title: 'Fill in the Blanks — History',
    skill: 'Reading',
    difficulty: 'Medium',
    status: 'draft' as const,
    uses: 0,
  },
  {
    id: 'q-4',
    title: 'Write from Dictation — Science Lecture',
    skill: 'Listening',
    difficulty: 'Hard',
    status: 'active' as const,
    uses: 2104,
  },
  {
    id: 'q-5',
    title: 'Describe Image — Population Graph',
    skill: 'Speaking',
    difficulty: 'Easy',
    status: 'archived' as const,
    uses: 567,
  },
];

const SIDEBAR_NAV = [
  { label: 'Dashboard', active: true },
  { label: 'Users', active: false },
  { label: 'Roles', active: false },
  { label: 'Analytics', active: false },
  { label: 'Content', active: false },
  { label: 'Settings', active: false },
];

const questionColumns: TableColumn<(typeof MOCK_QUESTION_BANK)[number]>[] = [
  { key: 'title', header: 'Question', cell: (row) => <span style={{ fontWeight: 500 }}>{row.title}</span> },
  { key: 'skill', header: 'Skill', cell: (row) => <Badge>{row.skill}</Badge> },
  {
    key: 'difficulty',
    header: 'Difficulty',
    cell: (row) => (
      <Badge variant={row.difficulty === 'Hard' ? 'danger' : row.difficulty === 'Medium' ? 'warning' : 'success'}>
        {row.difficulty}
      </Badge>
    ),
  },
  {
    key: 'status',
    header: 'Status',
    cell: (row) => (
      <Badge variant={row.status === 'active' ? 'success' : row.status === 'draft' ? 'warning' : 'default'}>
        {row.status}
      </Badge>
    ),
  },
  { key: 'uses', header: 'Uses', cell: (row) => row.uses.toLocaleString() },
  {
    key: 'actions',
    header: '',
    cell: () => (
      <Button size="sm" variant="secondary">
        Edit
      </Button>
    ),
  },
];

export default function AdminDashboard() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar navigation */}
      <aside
        className="admin-sidebar"
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
      >
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>
            <span className="ds-gradient-text">Admin Portal</span>
          </h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-muted)', marginTop: 'var(--space-1)' }}>
            System Administration
          </p>
        </div>
        {SIDEBAR_NAV.map((item) => (
          <a
            key={item.label}
            href={`#${item.label.toLowerCase()}`}
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
            }}
          >
            {item.label}
          </a>
        ))}
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, minWidth: 0, padding: 'var(--space-6)', overflow: 'auto' }}>
        <Container>
          {/* Page header */}
          <div className="app-page-header" style={{ marginBottom: 'var(--space-8)' }}>
            <div>
              <h1 className="app-page-header__title">
                <span className="ds-gradient-text">Admin Dashboard</span>
              </h1>
              <p className="app-page-header__subtitle">
                System overview, user management, and platform administration.
              </p>
            </div>
            <div className="app-page-header__actions">
              <Button variant="secondary">System Health</Button>
              <Button>Invite User</Button>
            </div>
          </div>

          {/* KPI cards */}
          <div className="app-stat-grid" style={{ marginBottom: 'var(--space-8)' }}>
            <StatCard
              title="Monthly Recurring Revenue"
              value="$10,258"
              trend={{ value: 12, label: 'vs last month', positive: true }}
            />
            <StatCard
              title="Total Students"
              value="1,248"
              trend={{ value: 8, label: 'vs last month', positive: true }}
            />
            <StatCard title="Active Teachers" value="12" trend={{ value: 2, label: 'this month', positive: true }} />
            <StatCard title="Active Sessions" value="34" icon={<span className="ds-pulse-dot" />} />
          </div>

          {/* Secondary stats row */}
          <div className="status-grid" style={{ marginBottom: 'var(--space-8)' }}>
            <div className="ds-card--premium" style={{ padding: 'var(--space-6)' }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-muted)', marginBottom: 'var(--space-2)' }}>
                System Health
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <Badge variant="success">Operational</Badge>
              </div>
            </div>
            <div className="ds-card--premium" style={{ padding: 'var(--space-6)' }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-muted)', marginBottom: 'var(--space-2)' }}>
                Support Tickets
              </p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-3)' }}>
                <p style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                  {SUPPORT_TICKETS.length}
                </p>
                <Badge variant="warning">4 open</Badge>
              </div>
            </div>
            <div className="ds-card--premium" style={{ padding: 'var(--space-6)' }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-muted)', marginBottom: 'var(--space-2)' }}>
                Active Subscriptions
              </p>
              <p style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>342</p>
            </div>
          </div>

          {/* Question bank table */}
          <section id="content" style={{ marginBottom: 'var(--space-8)' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 'var(--space-4)',
              }}
            >
              <h2 className="app-section__title" style={{ marginBottom: 0 }}>
                Question Bank
              </h2>
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <Button size="sm" variant="secondary">
                  Import
                </Button>
                <Button size="sm">Add Question</Button>
              </div>
            </div>
            <Table columns={questionColumns} rows={MOCK_QUESTION_BANK} keyExtractor={(row) => row.id} />
          </section>

          {/* Recent support tickets */}
          <section id="users" style={{ marginBottom: 'var(--space-8)' }}>
            <h2 className="app-section__title">Recent Support Tickets</h2>
            <div style={{ display: 'grid', gap: 'var(--space-4)', gridTemplateColumns: 'repeat(1, 1fr)' }}>
              {SUPPORT_TICKETS.map((ticket) => (
                <Card key={ticket.id}>
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
                      <h3 style={{ fontWeight: 600, fontSize: '0.9375rem', marginBottom: 'var(--space-1)' }}>
                        {ticket.id}: {ticket.subject}
                      </h3>
                      <p style={{ fontSize: '0.8125rem', color: 'var(--color-muted)' }}>
                        {ticket.date} · Assigned to: {ticket.assignee}
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <Badge
                        variant={
                          ticket.priority === 'high' ? 'danger' : ticket.priority === 'medium' ? 'warning' : 'default'
                        }
                      >
                        {ticket.priority}
                      </Badge>
                      <Badge
                        variant={
                          ticket.status === 'open' ? 'warning' : ticket.status === 'resolved' ? 'success' : 'default'
                        }
                      >
                        {ticket.status}
                      </Badge>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </section>

          {/* Analytics placeholder */}
          <section id="analytics" style={{ marginBottom: 'var(--space-8)' }}>
            <h2 className="app-section__title">Analytics Overview</h2>
            <div className="status-grid">
              <Card>
                <div style={{ textAlign: 'center', padding: 'var(--space-6)' }}>
                  <p style={{ fontSize: '2rem', marginBottom: 'var(--space-2)' }}>📊</p>
                  <p style={{ fontWeight: 600, marginBottom: 'var(--space-1)' }}>Revenue Trend</p>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--color-muted)' }}>
                    {/* TODO: Connect to real analytics endpoint */}
                    Line chart of MRR over last 12 months
                  </p>
                </div>
              </Card>
              <Card>
                <div style={{ textAlign: 'center', padding: 'var(--space-6)' }}>
                  <p style={{ fontSize: '2rem', marginBottom: 'var(--space-2)' }}>📈</p>
                  <p style={{ fontWeight: 600, marginBottom: 'var(--space-1)' }}>User Growth</p>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--color-muted)' }}>
                    {/* TODO: Connect to real analytics endpoint */}
                    Bar chart of new registrations per month
                  </p>
                </div>
              </Card>
              <Card>
                <div style={{ textAlign: 'center', padding: 'var(--space-6)' }}>
                  <p style={{ fontSize: '2rem', marginBottom: 'var(--space-2)' }}>🎯</p>
                  <p style={{ fontWeight: 600, marginBottom: 'var(--space-1)' }}>Conversion Funnel</p>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--color-muted)' }}>
                    {/* TODO: Connect to real analytics endpoint */}
                    Free → Premium → Pro conversion rates
                  </p>
                </div>
              </Card>
            </div>
          </section>
        </Container>
      </main>

      <style>{`
        @media (min-width: 1024px) {
          .admin-sidebar {
            display: flex !important;
          }
        }
      `}</style>
    </div>
  );
}
