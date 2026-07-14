import { redirect } from 'next/navigation';
import { Container, Card, Badge } from '@pte-app/design-system';
import { getCurrentUser } from '../../lib/auth';

export default async function AdminDashboard() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  return (
    <main style={{ paddingTop: '3rem', paddingBottom: '3rem' }}>
      <Container>
        <h1 style={{ marginBottom: '1.5rem' }}>Admin Dashboard</h1>
        <div className="status-grid">
          <Card>
            <h3>User overview</h3>
            <p style={{ fontSize: '2rem', fontWeight: 700 }}>0</p>
            <span style={{ color: 'var(--color-muted)', fontSize: '0.875rem' }}>Registered users</span>
          </Card>
          <Card>
            <h3>System health</h3>
            <Badge variant="success">Operational</Badge>
          </Card>
          <Card>
            <h3>Content status</h3>
            <Badge variant="success">Published</Badge>
          </Card>
          <Card>
            <h3>Audit summary</h3>
            <p style={{ color: 'var(--color-muted)', fontSize: '0.875rem' }}>Audit log will appear here.</p>
          </Card>
        </div>
      </Container>
    </main>
  );
}
