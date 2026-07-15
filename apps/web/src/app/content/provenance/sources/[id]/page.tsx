import { Container, Card, Badge } from '@pte-app/design-system';
import { requireRole } from '../../../../../lib/role-guard';

export default async function SourceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole('/content');
  const { id } = await params;

  return (
    <main style={{ paddingTop: '3rem', paddingBottom: '3rem' }}>
      <Container>
        <h1 style={{ marginBottom: '1.5rem' }}>Source Detail</h1>
        <Card>
          <p style={{ color: 'var(--color-muted)' }}>Source {id} details load from the API.</p>
          <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
            <Badge variant="default">Draft</Badge>
          </div>
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
