import { Container, Card, Button } from '@pte-app/design-system';
import { requireRole } from '../../../../lib/role-guard';

export default async function LicencesPage() {
  await requireRole('/content');

  return (
    <main style={{ paddingTop: '3rem', paddingBottom: '3rem' }}>
      <Container>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h1>Licence Register</h1>
          <a href="/content/provenance/licences/new">
            <Button>Add Licence</Button>
          </a>
        </div>
        <p style={{ color: 'var(--color-muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>
          All content licences must be registered. Licences can be superseded, revoked, or expired.
        </p>
        <Card>
          <p style={{ color: 'var(--color-muted)' }}>Licence list loads from the content-provenance API.</p>
        </Card>
      </Container>
    </main>
  );
}
