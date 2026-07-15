import { Container, Card, Button } from '@pte-app/design-system';
import { requireRole } from '../../../../lib/role-guard';

export default async function SourcesPage() {
  await requireRole('/content');

  return (
    <main style={{ paddingTop: '3rem', paddingBottom: '3rem' }}>
      <Container>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h1>Source Register</h1>
          <a href="/content/provenance/sources/new" data-testid="new-source-link">
            <Button>Add Source</Button>
          </a>
        </div>
        <p style={{ color: 'var(--color-muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>
          All content sources must be registered before creating provenance records.
        </p>
        <Card data-testid="source-list">
          <p style={{ color: 'var(--color-muted)' }}>
            Source list loads from the content-provenance API. Create a source to begin.
          </p>
        </Card>
      </Container>
    </main>
  );
}
