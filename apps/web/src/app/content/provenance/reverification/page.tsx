import { Container, Card } from '@pte-app/design-system';
import { requireRole } from '../../../../lib/role-guard';

export default async function ReVerificationPage() {
  await requireRole('/content');

  return (
    <main style={{ paddingTop: '3rem', paddingBottom: '3rem' }}>
      <Container>
        <h1 style={{ marginBottom: '1.5rem' }}>Re-verification Queue</h1>
        <p style={{ color: 'var(--color-muted)', marginBottom: '1rem' }}>
          Items requiring re-verification after licence or content changes.
        </p>
        <Card data-testid="reverification-queue-list">
          <div data-testid="reverification-queue-empty" style={{ padding: '1rem' }}>
            <p style={{ color: 'var(--color-muted)' }}>No items awaiting re-verification.</p>
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
