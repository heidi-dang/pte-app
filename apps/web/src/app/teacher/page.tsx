import { redirect } from 'next/navigation';
import { Container, Card, Badge } from '@pte-app/design-system';
import { getCurrentUser } from '../../lib/auth';

export default async function TeacherDashboard() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  return (
    <main style={{ paddingTop: '3rem', paddingBottom: '3rem' }}>
      <Container>
        <h1 style={{ marginBottom: '1.5rem' }}>Teacher Dashboard</h1>
        <div className="status-grid">
          <Card>
            <h3>Class overview</h3>
            <p style={{ fontSize: '2rem', fontWeight: 700 }}>24</p>
            <span style={{ color: 'var(--color-muted)', fontSize: '0.875rem' }}>Active students</span>
          </Card>
          <Card>
            <h3>Student activity</h3>
            <p style={{ color: 'var(--color-muted)', fontSize: '0.875rem' }}>
              Recent student activity will appear here.
            </p>
          </Card>
          <Card>
            <h3>Review queue</h3>
            <Badge variant="warning">3 pending</Badge>
            <p style={{ color: 'var(--color-muted)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
              Assessments awaiting your review.
            </p>
          </Card>
        </div>
      </Container>
    </main>
  );
}
