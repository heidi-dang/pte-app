import { Container, Card, Badge, Button } from '@pte-app/design-system';

export const metadata = {
  title: 'Certificates — PTE Academy',
  description: 'Your PTE Academy certificates and achievements.',
};

export default function CertificatesPage() {
  return (
    <main>
      <Container>
        <h1 className="app-page-header__title" style={{ marginBottom: '1.5rem' }}>Certificates</h1>
        <div className="status-grid" style={{ gridTemplateColumns: 'repeat(1, 1fr)' }}>
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 className="landing__feature-title">Speaking Mastery</h3>
                <p className="landing__feature-desc">Completed 18 lessons · 4.8 average quiz score</p>
              </div>
              <Badge variant="success">Earned</Badge>
            </div>
            <Button variant="secondary" size="sm" style={{ marginTop: '1rem' }}>Download certificate</Button>
          </Card>
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 className="landing__feature-title">Full Mock Exam</h3>
                <p className="landing__feature-desc">Score 73 · 14 July 2026</p>
              </div>
              <Badge variant="warning">In progress</Badge>
            </div>
          </Card>
        </div>
      </Container>
    </main>
  );
}
