import { Container, Card } from '@pte-app/design-system';
import { requireRole } from '../../../../lib/role-guard';

export default async function ReviewQueuePage() {
  await requireRole('/content');

  return (
    <main style={{ paddingTop: '3rem', paddingBottom: '3rem' }}>
      <Container>
        <h1 style={{ marginBottom: '1.5rem' }}>Review Queue</h1>
        <p style={{ color: 'var(--color-muted)', marginBottom: '1rem' }}>Items awaiting review.</p>
        <Card data-testid="review-queue-list">
          <div data-testid="review-queue-empty" style={{ padding: '1rem' }}>
            <p style={{ color: 'var(--color-muted)' }}>
              No items currently in the review queue. Submitted records appear here for admin review.
            </p>
          </div>
        </Card>
        <div style={{ marginTop: '1rem' }}>
          <a href="/content/provenance" style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>
            Back to dashboard
          </a>
        </div>
      </Container>
    </main>
  );
}
