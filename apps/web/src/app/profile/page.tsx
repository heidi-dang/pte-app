import { Container, Card, Button, Input, Avatar } from '@pte-app/design-system';

export const metadata = {
  title: 'Profile — PTE Academy',
  description: 'Your PTE Academy profile.',
};

export default function ProfilePage() {
  return (
    <main>
      <Container>
        <h1 className="app-page-header__title" style={{ marginBottom: '1.5rem' }}>Profile</h1>
        <div className="status-grid" style={{ gridTemplateColumns: 'repeat(1, 1fr)' }}>
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <Avatar initials="AJ" size="lg" />
              <div>
                <h3 className="landing__feature-title">Alex Johnson</h3>
                <p className="landing__feature-desc">student@pte.app</p>
              </div>
            </div>
            <form style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <Input label="Display name" defaultValue="Alex Johnson" />
              <Input label="Email" type="email" defaultValue="student@pte.app" />
              <Input label="Country" defaultValue="Australia" />
              <Button type="submit">Save changes</Button>
            </form>
          </Card>
        </div>
      </Container>
    </main>
  );
}
