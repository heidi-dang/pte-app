import { Container, Card, Badge } from '@pte-app/design-system';

export const metadata = {
  title: 'Admin Dashboard — PTE Academy',
  description: 'Administration dashboard.',
};

export default function AdminDashboard() {
  return (
    <main>
      <Container>
        <h1 className="app-page-header__title" style={{ marginBottom: '1.5rem' }}>
          Admin Dashboard
        </h1>
        <div className="status-grid">
          <Card>
            <h3 className="app-info-card__title">Registered users</h3>
            <p style={{ fontSize: '2rem', fontWeight: 700 }}>1,248</p>
          </Card>
          <Card>
            <h3 className="app-info-card__title">System health</h3>
            <Badge variant="success">Operational</Badge>
          </Card>
          <Card>
            <h3 className="app-info-card__title">Active subscriptions</h3>
            <p style={{ fontSize: '2rem', fontWeight: 700 }}>342</p>
          </Card>
          <Card>
            <h3 className="app-info-card__title">Support tickets</h3>
            <p style={{ fontSize: '2rem', fontWeight: 700 }}>12</p>
            <Badge variant="warning">4 open</Badge>
          </Card>
        </div>
      </Container>
    </main>
  );
}
