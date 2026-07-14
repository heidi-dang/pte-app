'use client';

import { Container, Card, ErrorState } from '@pte-app/design-system';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main style={{ paddingTop: '3rem', paddingBottom: '3rem' }}>
      <Container>
        <Card style={{ maxWidth: '28rem', margin: '0 auto' }}>
          <ErrorState message={error.message || 'An unexpected error occurred'} onRetry={reset} />
        </Card>
      </Container>
    </main>
  );
}
