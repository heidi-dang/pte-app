import { Container, Card } from '@pte-app/design-system';
import { requireRole } from '../../../../lib/role-guard';

export default async function ReportsPage() {
  await requireRole('/content');

  return (
    <main style={{ paddingTop: '3rem', paddingBottom: '3rem' }}>
      <Container>
        <h1 style={{ marginBottom: '1.5rem' }}>Audit Report</h1>
        <p style={{ color: 'var(--color-muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>
          Generate and view provenance audit reports. Reports include totals, blocked content, missing evidence, pending
          reviews, and historical changes.
        </p>
        <Card>
          <h3>Report Generation</h3>
          <p style={{ color: 'var(--color-muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>
            Click generate to create a new audit report from the current system state.
          </p>
          <button
            style={{
              padding: '0.5rem 1rem',
              background: 'var(--color-primary)',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Generate Report
          </button>
        </Card>
        <div style={{ marginTop: '1.5rem' }}>
          <Card>
            <h3>Report History</h3>
            <p style={{ color: 'var(--color-muted)', fontSize: '0.875rem' }}>Previous audit reports appear here.</p>
          </Card>
        </div>
      </Container>
    </main>
  );
}
