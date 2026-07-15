import { Container, Card } from '@pte-app/design-system';
import { requireRole } from '../../../../lib/role-guard';

export default async function ReportsPage() {
  await requireRole('/content');

  return (
    <main style={{ paddingTop: '3rem', paddingBottom: '3rem' }}>
      <Container>
        <h1 style={{ marginBottom: '1.5rem' }}>Audit Reports</h1>
        <Card data-testid="audit-report">
          <div data-testid="audit-sequence" style={{ padding: '1rem' }}>
            <p style={{ color: 'var(--color-muted)' }}>Action sequence loads from the audit API endpoint.</p>
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
