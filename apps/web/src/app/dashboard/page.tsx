import { redirect } from 'next/navigation';
import { Container, Card, Button } from '@pte-app/design-system';
import { getCurrentUser, logoutAccount } from '../../lib/auth';

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  return (
    <main style={{ paddingTop: '3rem', paddingBottom: '3rem' }}>
      <Container>
        <Card>
          <h1 style={{ marginBottom: '1rem' }}>Dashboard</h1>
          <p>
            <strong>Email:</strong> {user.email}
          </p>
          <p>
            <strong>Display name:</strong> {user.displayName ?? '-'}
          </p>
          <p>
            <strong>Roles:</strong> {user.roles.join(', ') || 'none'}
          </p>
          <form action={logoutAccount} style={{ marginTop: '1.5rem' }}>
            <Button type="submit" variant="secondary">
              Log out
            </Button>
          </form>
        </Card>
      </Container>
    </main>
  );
}
