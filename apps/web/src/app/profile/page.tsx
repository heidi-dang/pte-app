import { Container, Card, Button, Input, Avatar } from '@pte-app/design-system';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Profile — PTE Academy',
  description: 'Your PTE Academy profile.',
};

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  const initials = (user.displayName || user.email)
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <main>
      <Container>
        <h1 className="app-page-header__title" style={{ marginBottom: '1.5rem' }}>Profile</h1>
        <div className="status-grid" style={{ gridTemplateColumns: 'repeat(1, 1fr)' }}>
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <Avatar initials={initials} size="lg" />
              <div>
                <h3 className="landing__feature-title">{user.displayName || 'User'}</h3>
                <p className="landing__feature-desc">{user.email}</p>
              </div>
            </div>
            <form style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <Input label="Display name" defaultValue={user.displayName || ''} />
              <Input label="Email" type="email" defaultValue={user.email} />
              <Button type="submit">Save changes</Button>
            </form>
          </Card>
        </div>
      </Container>
    </main>
  );
}
