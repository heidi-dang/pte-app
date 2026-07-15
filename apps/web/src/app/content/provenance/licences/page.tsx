import { Container, Card, Button } from '@pte-app/design-system';
import { requireRole } from '../../../../lib/role-guard';

export default async function LicencesPage() {
  await requireRole('/content');

  return (
    <main style={{ paddingTop: '3rem', paddingBottom: '3rem' }}>
      <Container>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h1>Licence Register</h1>
          <a href="/content/provenance/licences/new" data-testid="new-licence-link">
            <Button>Create Licence</Button>
          </a>
        </div>
        <Card data-testid="licence-list">
          <p style={{ color: 'var(--color-muted)' }}>
            Licence list loads from the content-provenance API. Create a licence to begin.
          </p>
        </Card>
      </Container>
    </main>
  );
}
