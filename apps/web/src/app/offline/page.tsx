import { Container, Card } from '@pte-app/design-system';

export default function OfflinePage() {
  return (
    <main style={{ paddingTop: '3rem', paddingBottom: '3rem' }}>
      <Container>
        <Card style={{ textAlign: 'center', maxWidth: '28rem', margin: '0 auto' }}>
          <h1 style={{ marginBottom: '1rem' }}>You are offline</h1>
          <p style={{ color: 'var(--color-muted)' }}>Please check your internet connection and try again.</p>
        </Card>
      </Container>
    </main>
  );
}
