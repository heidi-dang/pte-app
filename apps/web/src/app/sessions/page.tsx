import { redirect } from 'next/navigation';
import { Container, Card, Button, EmptyState } from '@pte-app/design-system';
import { getCurrentUser, logoutAccount } from '../../lib/auth';

export default async function SessionsPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  return (
    <main style={{ paddingTop: '3rem', paddingBottom: '3rem' }}>
      <Container>
        <Card>
          <h1 style={{ marginBottom: '1rem' }}>Active sessions</h1>
          <EmptyState title="No active sessions" description="You do not have any active sessions." />
          <form action={logoutAccount} style={{ marginTop: '1rem' }}>
            <Button type="submit" variant="danger">
              Log out all sessions
            </Button>
          </form>
        </Card>
      </Container>
    </main>
  );
}
