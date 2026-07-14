import { Container, Card, Skeleton } from '@pte-app/design-system';

export default function DashboardLoading() {
  return (
    <main style={{ paddingTop: '3rem', paddingBottom: '3rem' }}>
      <Container>
        <Skeleton width="30%" height="1.5rem" />
        <div style={{ marginTop: '1rem' }} className="status-grid">
          <Card>
            <Skeleton height="3rem" />
          </Card>
          <Card>
            <Skeleton height="3rem" />
          </Card>
        </div>
      </Container>
    </main>
  );
}
