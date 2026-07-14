import { Container, Card, Button } from '@pte-app/design-system';
import Link from 'next/link';

export default function NotFound() {
  return (
    <main style={{ paddingTop: '3rem', paddingBottom: '3rem' }}>
      <Container>
        <Card style={{ textAlign: 'center', maxWidth: '28rem', margin: '0 auto' }}>
          <h1 style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>404</h1>
          <h2 style={{ marginBottom: '1rem' }}>Page not found</h2>
          <p style={{ color: 'var(--color-muted)', marginBottom: '1.5rem' }}>
            The page you are looking for does not exist.
          </p>
          <Link href="/">
            <Button>Go to home</Button>
          </Link>
        </Card>
      </Container>
    </main>
  );
}
