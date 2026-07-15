import { Container, Card, Badge } from '@pte-app/design-system';
import { requireRole } from '../../lib/role-guard';

export default async function ContentDashboard() {
  await requireRole('/content');

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
          <Card>
            <h3>Content Provenance</h3>
            <p style={{ color: 'var(--color-muted)', fontSize: '0.875rem' }}>
              Source, licence, and publication controls.
            </p>
            <a
              href="/content/provenance"
              style={{ color: 'var(--color-primary)', textDecoration: 'none', fontSize: '0.875rem' }}
            >
              Open provenance dashboard
            </a>
          </Card>
        </div>
      </Container>
    </main>
  );
}
