import { Container, Card, Badge } from '@pte-app/design-system';
import { requireRole } from '../../../../../lib/role-guard';

export default async function SourceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole('/content');
  const { id } = await params;

  return (
    <main style={{ paddingTop: '3rem', paddingBottom: '3rem' }}>
      <Container>
        <h1 style={{ marginBottom: '1.5rem' }}>
          Source <span data-testid="source-id">#{id}</span>
        </h1>
        <Card data-testid="source-detail-card">
          <dl style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '0.5rem' }}>
            <dt style={{ fontWeight: 600 }}>ID:</dt>
            <dd data-testid="source-id-value">{id}</dd>
            <dt style={{ fontWeight: 600 }}>Status:</dt>
            <dd data-testid="source-status-value">
              <Badge variant="default">Draft</Badge>
            </dd>
          </dl>
        </Card>
        <div style={{ marginTop: '1rem' }}>
          <a href="/content/provenance/sources" style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>
            Back to sources
          </a>
        </div>
      </Container>
    </main>
  );
}
