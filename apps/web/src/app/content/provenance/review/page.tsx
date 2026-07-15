import { Container, Card, Badge } from '@pte-app/design-system';
import { requireRole } from '../../../../lib/role-guard';

export default async function ReviewQueuePage() {
  await requireRole('/content');

  return (
    <main style={{ paddingTop: '3rem', paddingBottom: '3rem' }}>
      <Container>
        <h1 style={{ marginBottom: '1.5rem' }}>Review Queue</h1>
        <p style={{ color: 'var(--color-muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>
          Provenance records awaiting admin review. Admins must review and verify or reject submissions.
        </p>
        <Card>
          <p style={{ color: 'var(--color-muted)' }}>Review queue loads submitted provenance records from the API.</p>
          <div style={{ marginTop: '1rem' }}>
            <Badge variant="warning">No items in queue</Badge>
          </div>
        </Card>
      </Container>
    </main>
  );
}
