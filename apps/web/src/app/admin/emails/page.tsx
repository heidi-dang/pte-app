import { Container, Card, Button } from '@pte-app/design-system';

export const metadata = {
  title: 'Email Templates — PTE Academy',
  description: 'Manage email templates.',
};

export default function EmailTemplatesPage() {
  return (
    <main>
      <Container>
        <h1 className="app-page-header__title" style={{ marginBottom: '1.5rem' }}>Email templates</h1>
        <div className="status-grid" style={{ gridTemplateColumns: 'repeat(1, 1fr)' }}>
          <Card>
            <h3 className="landing__feature-title">Welcome email</h3>
            <p className="landing__feature-desc">Sent when a new student registers.</p>
            <Button size="sm" variant="secondary">Edit</Button>
          </Card>
          <Card>
            <h3 className="landing__feature-title">Password reset</h3>
            <p className="landing__feature-desc">Sent when a user requests a password reset.</p>
            <Button size="sm" variant="secondary">Edit</Button>
          </Card>
          <Card>
            <h3 className="landing__feature-title">Study reminder</h3>
            <p className="landing__feature-desc">Daily reminder to keep streaks alive.</p>
            <Button size="sm" variant="secondary">Edit</Button>
          </Card>
        </div>
      </Container>
    </main>
  );
}
