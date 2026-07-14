import { redirect } from 'next/navigation';
import { Container, Card, Button, Label, Input } from '@pte-app/design-system';
import { getCurrentUser } from '../../lib/auth';

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  return (
    <main style={{ paddingTop: '3rem', paddingBottom: '3rem' }}>
      <Container>
        <Card>
          <h1 style={{ marginBottom: '1rem' }}>Profile</h1>
          <div className="ds-stack">
            <div>
              <Label htmlFor="displayName">Display name</Label>
              <Input id="displayName" name="displayName" defaultValue={user.displayName ?? ''} />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={user.email} disabled />
            </div>
            <Button type="submit">Save changes</Button>
          </div>
        </Card>
      </Container>
    </main>
  );
}
