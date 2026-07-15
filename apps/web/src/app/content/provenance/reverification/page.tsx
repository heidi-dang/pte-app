import { Container, Card, Badge } from '@pte-app/design-system';
import { requireRole } from '../../../../lib/role-guard';

export default async function ReverificationPage() {
  await requireRole('/content');

  return (
    <main style={{ paddingTop: '3rem', paddingBottom: '3rem' }}>
      <Container>
        <h1 style={{ marginBottom: '1.5rem' }}>Re-verification Queue</h1>
        <p style={{ color: 'var(--color-muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>
          Re-verification jobs created when licences expire, are revoked, sources are disputed, or policies change.
        </p>
        <Card>
          <p style={{ color: 'var(--color-muted)' }}>Pending re-verification jobs load from the API.</p>
          <div style={{ marginTop: '1rem' }}>
            <Badge variant="default">No pending jobs</Badge>
          </div>
        </Card>
      </Container>
    </main>
  );
}
