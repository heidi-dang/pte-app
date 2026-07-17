import { Container, Card, Button } from '@pte-app/design-system';
import { PageHeader } from '@/components/PageShell';

export const metadata = {
  title: 'Mock Exam — PTE Academy',
  description: 'Take a full PTE Academic mock exam under realistic conditions.',
};

export default function MockExamHubPage() {
  return (
    <main>
      <Container>
        <PageHeader title="Mock exam" subtitle="Simulate test-day conditions and receive an estimated score report.">
          <a href="/mock-exam/history">
            <Button variant="secondary">History</Button>
          </a>
        </PageHeader>
        <div className="status-grid" style={{ gridTemplateColumns: 'repeat(1, 1fr)' }}>
          <Card>
            <h3 className="landing__feature-title">Full PTE Academic mock exam</h3>
            <p className="landing__feature-desc">
              2 hours · All 20 task types · Estimated scoring · Instant AI feedback for speaking and writing.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', flexWrap: 'wrap' }}>
              <a href="/mock-exam/lobby">
                <Button>Start mock exam</Button>
              </a>
              <a href="/mock-exam/lobby">
                <Button variant="secondary">Device check</Button>
              </a>
            </div>
          </Card>
          <Card>
            <h3 className="landing__feature-title">Your last exam</h3>
            <p className="landing__feature-desc">Full Mock Exam #4 · Score 70 · Taken 2 days ago</p>
            <a href="/mock-exam/results">
              <Button variant="secondary" size="sm">
                Review results
              </Button>
            </a>
          </Card>
        </div>
      </Container>
    </main>
  );
}
