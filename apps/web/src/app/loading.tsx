import { Container, Card, Skeleton } from '@pte-app/design-system';

export default function LoadingPage() {
  return (
    <main style={{ paddingTop: '3rem', paddingBottom: '3rem' }}>
      <Container>
        <Card>
          <Skeleton width="40%" height="1.5rem" />
          <div style={{ marginTop: '1rem' }}>
            <Skeleton width="100%" height="1rem" />
          </div>
          <div style={{ marginTop: '0.5rem' }}>
            <Skeleton width="80%" height="1rem" />
          </div>
        </Card>
      </Container>
    </main>
  );
}
