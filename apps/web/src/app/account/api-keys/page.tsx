import { Container, Card, Button, Input } from '@pte-app/design-system';

export const metadata = {
  title: 'API Keys — PTE Academy',
  description: 'Manage your API keys.',
};

export default function ApiKeysPage() {
  return (
    <main>
      <Container>
        <h1 className="app-page-header__title" style={{ marginBottom: '1.5rem' }}>
          API Keys
        </h1>
        <Card>
          <h3 className="app-info-card__title">Your API key</h3>
          <p className="landing__feature-desc">Use this key to access mock API endpoints for testing.</p>
          <Input value="pte_mock_abc123xyz789" readOnly style={{ marginTop: '1rem', fontFamily: 'monospace' }} />
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
            <Button variant="secondary">Copy</Button>
            <Button variant="danger">Revoke</Button>
          </div>
        </Card>
      </Container>
    </main>
  );
}
