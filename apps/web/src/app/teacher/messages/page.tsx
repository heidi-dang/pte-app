import { Container, Card, Button, Input } from '@pte-app/design-system';

export const metadata = {
  title: 'Messages — PTE Academy',
  description: 'Communicate with your students.',
};

export default function TeacherMessagesPage() {
  return (
    <main>
      <Container>
        <h1 className="app-page-header__title" style={{ marginBottom: '1.5rem' }}>Messages</h1>
        <div className="status-grid" style={{ gridTemplateColumns: 'repeat(1, 1fr)' }}>
          <Card>
            <h3 className="app-info-card__title">Alex Johnson</h3>
            <p className="landing__feature-desc">Could you review my latest Read Aloud response?</p>
          </Card>
          <Card>
            <h3 className="app-info-card__title">Priya Sharma</h3>
            <p className="landing__feature-desc">I am struggling with essay structure. Can we schedule a session?</p>
          </Card>
        </div>
        <Card style={{ marginTop: '1.5rem' }}>
          <Input placeholder="Type a message..." />
          <Button style={{ marginTop: '1rem' }}>Send</Button>
        </Card>
      </Container>
    </main>
  );
}
