import { redirect } from 'next/navigation';
import { Container, Card, Button, Badge, Progress, StatCard } from '@pte-app/design-system';
import { getCurrentUser, logoutAccount } from '@/lib/auth';
import { MOCK_ACTIVITIES, SKILL_BREAKDOWN } from '@/lib/mock-data';

export const metadata = {
  title: 'Dashboard — PTE Academy',
  description: 'Your PTE Academy dashboard.',
};

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  return (
    <main>
      <Container>
        <h1 className="app-page-header__title" style={{ marginBottom: '0.5rem' }}>
          Dashboard
        </h1>
        <p className="app-page-header__subtitle" style={{ marginBottom: '1.5rem' }}>
          Welcome back, {user?.displayName || user?.email}.
        </p>

        <div className="app-stat-grid" style={{ marginBottom: '2rem' }}>
          <StatCard title="Estimated score" value="72" trend={{ value: 8, label: 'this month', positive: true }} />
          <StatCard title="Study streak" value="12 days" />
          <StatCard title="Tasks today" value="4" />
          <StatCard title="Next exam" value="27 days" />
        </div>

        <div className="status-grid" style={{ marginBottom: '2rem' }}>
          <Card>
            <h3 className="app-info-card__title">Skills</h3>
            {[
              { label: 'Speaking', value: SKILL_BREAKDOWN.speaking },
              { label: 'Writing', value: SKILL_BREAKDOWN.writing },
              { label: 'Reading', value: SKILL_BREAKDOWN.reading },
              { label: 'Listening', value: SKILL_BREAKDOWN.listening },
            ].map((skill) => (
              <div key={skill.label} style={{ marginBottom: '0.75rem' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.875rem',
                    marginBottom: '0.25rem',
                  }}
                >
                  <span>{skill.label}</span>
                  <strong>{skill.value}</strong>
                </div>
                <Progress value={skill.value} />
              </div>
            ))}
          </Card>
          <Card>
            <h3 className="app-info-card__title">Account</h3>
            <p style={{ marginBottom: '0.5rem' }}>
              <strong>Email:</strong> {user?.email}
            </p>
            <p style={{ marginBottom: '0.5rem' }}>
              <strong>Roles:</strong> {user?.roles.join(', ') || 'none'}
            </p>
            <form action={logoutAccount} style={{ marginTop: '1rem' }}>
              <Button type="submit" variant="secondary">
                Log out
              </Button>
            </form>
          </Card>
        </div>

        <h2 className="app-section__title">Recent activity</h2>
        <div className="status-grid" style={{ gridTemplateColumns: 'repeat(1, 1fr)' }}>
          {MOCK_ACTIVITIES.slice(0, 3).map((activity) => (
            <Card key={activity.id}>
              <Badge>{activity.type}</Badge>
              <h3 className="landing__feature-title" style={{ marginTop: '0.5rem' }}>
                {activity.title}
              </h3>
              <p className="landing__feature-desc">{activity.date}</p>
            </Card>
          ))}
        </div>
      </Container>
    </main>
  );
}
