import { Container, Card, Button } from '@pte-app/design-system';
import Link from 'next/link';

export default function PermissionDeniedPage() {
  return (
    <main style={{ paddingTop: '3rem', paddingBottom: '3rem' }}>
      <Container>
        <Card style={{ textAlign: 'center', maxWidth: '28rem', margin: '0 auto' }}>
          <h1 style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>403</h1>
          <h2 style={{ marginBottom: '1rem' }}>Permission denied</h2>
          <p style={{ color: 'var(--color-muted)', marginBottom: '1.5rem' }}>
            You do not have access to this page. Contact your administrator if you believe this is an error.
          </p>
          <Link href="/">
            <Button>Go to home</Button>
          </Link>
        </Card>
      </Container>
    </main>
  );
}
