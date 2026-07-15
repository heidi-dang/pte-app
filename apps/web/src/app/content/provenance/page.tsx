import { Container, Card, Badge } from '@pte-app/design-system';
import { requireRole } from '../../../lib/role-guard';

export default async function ProvenanceDashboard() {
  await requireRole('/content');

  return (
    <main style={{ paddingTop: '3rem', paddingBottom: '3rem' }}>
      <Container>
        <h1 style={{ marginBottom: '1.5rem' }}>Content Provenance Dashboard</h1>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            marginBottom: '2rem',
          }}
        >
          <Card data-testid="dash-sources">
            <h3>Sources</h3>
            <p style={{ color: 'var(--color-muted)', fontSize: '0.875rem' }}>Manage content sources</p>
            <a
              href="/content/provenance/sources"
              data-testid="dash-sources-link"
              style={{ color: 'var(--color-primary)', textDecoration: 'none', fontSize: '0.875rem' }}
            >
              View register
            </a>
          </Card>
          <Card data-testid="dash-licences">
            <h3>Licences</h3>
            <p style={{ color: 'var(--color-muted)', fontSize: '0.875rem' }}>Manage content licences</p>
            <a
              href="/content/provenance/licences"
              data-testid="dash-licences-link"
              style={{ color: 'var(--color-primary)', textDecoration: 'none', fontSize: '0.875rem' }}
            >
              View register
            </a>
          </Card>
          <Card data-testid="dash-review">
            <h3>Review Queue</h3>
            <Badge variant="warning">Pending review</Badge>
            <a
              href="/content/provenance/review"
              data-testid="dash-review-link"
              style={{
                color: 'var(--color-primary)',
                textDecoration: 'none',
                fontSize: '0.875rem',
                display: 'block',
                marginTop: '0.5rem',
              }}
            >
              Open queue
            </a>
          </Card>
          <Card data-testid="dash-reverification">
            <h3>Re-verification</h3>
            <p style={{ color: 'var(--color-muted)', fontSize: '0.875rem' }}>Pending re-verification jobs</p>
            <a
              href="/content/provenance/reverification"
              data-testid="dash-reverification-link"
              style={{ color: 'var(--color-primary)', textDecoration: 'none', fontSize: '0.875rem' }}
            >
              View queue
            </a>
          </Card>
          <Card data-testid="dash-reports">
            <h3>Audit Reports</h3>
            <p style={{ color: 'var(--color-muted)', fontSize: '0.875rem' }}>View audit trail and reports</p>
            <a
              href="/content/provenance/reports"
              data-testid="dash-reports-link"
              style={{ color: 'var(--color-primary)', textDecoration: 'none', fontSize: '0.875rem' }}
            >
              Generate report
            </a>
          </Card>
        </div>
        <p style={{ color: 'var(--color-muted)', fontSize: '0.875rem' }}>
          Content provenance controls ensure every published item has verified source, licence, evidence, similarity
          check, and policy compliance.
        </p>
      </Container>
    </main>
  );
}
