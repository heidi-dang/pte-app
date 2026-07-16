import { Container, Card, Button } from '@pte-app/design-system';

export const metadata = {
  title: 'Reports — PTE Academy',
  description: 'Platform reports.',
};

export default function ReportsPage() {
  return (
    <main>
      <Container>
        <h1 className="app-page-header__title" style={{ marginBottom: '1.5rem' }}>Reports</h1>
        <div className="status-grid" style={{ gridTemplateColumns: 'repeat(1, 1fr)' }}>
          <Card>
            <h3 className="landing__feature-title">User growth</h3>
            <p className="landing__feature-desc">+128 new users this month.</p>
            <Button size="sm" variant="secondary">Download</Button>
          </Card>
          <Card>
            <h3 className="landing__feature-title">Revenue</h3>
            <p className="landing__feature-desc">$12,340 this month.</p>
            <Button size="sm" variant="secondary">Download</Button>
          </Card>
          <Card>
            <h3 className="landing__feature-title">Content performance</h3>
            <p className="landing__feature-desc">Top course: PTE Academic Complete Preparation.</p>
            <Button size="sm" variant="secondary">Download</Button>
          </Card>
        </div>
      </Container>
    </main>
  );
}
