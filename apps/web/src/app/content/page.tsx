import { redirect } from 'next/navigation';
import { Container, Card, Badge } from '@pte-app/design-system';
import { getCurrentUser } from '../../lib/auth';

export default async function ContentDashboard() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  return (
    <main style={{ paddingTop: '3rem', paddingBottom: '3rem' }}>
      <Container>
        <h1 style={{ marginBottom: '1.5rem' }}>Content management</h1>
        <div className="status-grid">
          <Card>
            <h3>Content items</h3>
            <p style={{ color: 'var(--color-muted)', fontSize: '0.875rem' }}>Content library will appear here.</p>
          </Card>
          <Card>
            <h3>Pending review</h3>
            <Badge variant="warning">0 pending</Badge>
          </Card>
        </div>
      </Container>
    </main>
  );
}
