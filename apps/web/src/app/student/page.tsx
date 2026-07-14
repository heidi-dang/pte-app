import { redirect } from 'next/navigation';
import { Container, Card, Badge, Progress } from '@pte-app/design-system';
import { getCurrentUser } from '../../lib/auth';

export default async function StudentDashboard() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  return (
    <main style={{ paddingTop: '3rem', paddingBottom: '3rem' }}>
      <Container>
        <h1 style={{ marginBottom: '0.5rem' }}>Welcome, {user.displayName ?? 'Student'}</h1>
        <p style={{ color: 'var(--color-muted)', marginBottom: '1.5rem' }}>
          Estimated training score: <Badge variant="warning">In progress</Badge>
        </p>
        <div className="status-grid">
          <Card>
            <h3>Study overview</h3>
            <p style={{ color: 'var(--color-muted)', fontSize: '0.875rem' }}>Your study overview will appear here.</p>
          </Card>
          <Card>
            <h3>Activity</h3>
            <p style={{ color: 'var(--color-muted)', fontSize: '0.875rem' }}>Recent activity will appear here.</p>
          </Card>
        </div>
        <h2 style={{ margin: '1.5rem 0 0.75rem' }}>Skills</h2>
        <div className="status-grid">
          <Card>
            <h3>Speaking</h3>
            <Progress value={65} />
            <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>65%</span>
          </Card>
          <Card>
            <h3>Writing</h3>
            <Progress value={70} />
            <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>70%</span>
          </Card>
          <Card>
            <h3>Reading</h3>
            <Progress value={80} />
            <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>80%</span>
          </Card>
          <Card>
            <h3>Listening</h3>
            <Progress value={75} />
            <span style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>75%</span>
          </Card>
        </div>
        <Card style={{ marginTop: '1.5rem' }}>
          <h3>Next step</h3>
          <p style={{ color: 'var(--color-muted)', fontSize: '0.875rem' }}>
            Complete your first practice test to get started.
          </p>
        </Card>
      </Container>
    </main>
  );
}
