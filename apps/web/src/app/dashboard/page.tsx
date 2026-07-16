import { redirect } from 'next/navigation';
import { Container, Card, Button, StatCard } from '@pte-app/design-system';
import { getCurrentUser, logoutAccount } from '@/lib/auth';

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
        <h1 className="app-page-header__title" style={{ marginBottom: '0.5rem' }}>Dashboard</h1>
        <p className="app-page-header__subtitle" style={{ marginBottom: '1.5rem' }}>
          Welcome back, {user?.displayName || user?.email}.
        </p>

        <div className="app-stat-grid" style={{ marginBottom: '2rem' }}>
          <StatCard title="Estimated score" value="--" trend={{ value: 0, label: 'complete a mock exam', positive: false }} />
          <StatCard title="Study streak" value="--" trend={{ value: 0, label: 'start practising', positive: false }} />
          <StatCard title="Tasks today" value="--" />
          <StatCard title="Next exam" value="--" />
        </div>

        <div className="status-grid" style={{ marginBottom: '2rem' }}>
          <Card>
            <h3 className="app-info-card__title">Quick actions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
              <a href="/practice"><Button style={{ width: '100%' }}>Start practising</Button></a>
              <a href="/learn/catalogue"><Button variant="secondary" style={{ width: '100%' }}>Browse courses</Button></a>
              <a href="/progress"><Button variant="secondary" style={{ width: '100%' }}>View progress</Button></a>
            </div>
          </Card>
          <Card>
            <h3 className="app-info-card__title">Account</h3>
            <p style={{ marginBottom: '0.5rem' }}><strong>Email:</strong> {user?.email}</p>
            <p style={{ marginBottom: '0.5rem' }}><strong>Roles:</strong> {user?.roles.join(', ') || 'none'}</p>
            <form action={logoutAccount} style={{ marginTop: '1rem' }}>
              <Button type="submit" variant="secondary">Log out</Button>
            </form>
          </Card>
        </div>
      </Container>
    </main>
  );
}
