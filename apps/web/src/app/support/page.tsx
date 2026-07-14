import { redirect } from 'next/navigation';
import { Container, Card, Badge } from '@pte-app/design-system';
import { getCurrentUser } from '../../lib/auth';

export default async function SupportDashboard() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  return (
    <main style={{ paddingTop: '3rem', paddingBottom: '3rem' }}>
      <Container>
        <h1 style={{ marginBottom: '1.5rem' }}>Support Dashboard</h1>
        <div className="status-grid">
          <Card>
            <h3>Open tickets</h3>
            <Badge variant="warning">0 open</Badge>
          </Card>
          <Card>
            <h3>User lookup</h3>
            <p style={{ color: 'var(--color-muted)', fontSize: '0.875rem' }}>User search will appear here.</p>
          </Card>
        </div>
      </Container>
    </main>
  );
}
