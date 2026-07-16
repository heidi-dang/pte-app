import { Container, Card, Progress } from '@pte-app/design-system';

export const metadata = {
  title: 'AI Feedback — PTE Academy',
  description: 'Review AI feedback for your PTE practice.',
};

export default function AIFeedbackPage() {
  return (
    <main>
      <Container>
        <h1 className="app-page-header__title" style={{ marginBottom: '1.5rem' }}>
          AI feedback
        </h1>
        <div className="status-grid" style={{ gridTemplateColumns: 'repeat(1, 1fr)' }}>
          <Card>
            <h3 className="app-info-card__title">Latest speaking analysis</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[
                { label: 'Fluency', value: 76 },
                { label: 'Pronunciation', value: 72 },
                { label: 'Content', value: 78 },
              ].map((item) => (
                <div key={item.label}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '0.875rem',
                      marginBottom: '0.25rem',
                    }}
                  >
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                  </div>
                  <Progress value={item.value} />
                </div>
              ))}
            </div>
            <a href="/feedback/speaking" style={{ display: 'inline-block', marginTop: '1rem' }}>
              View full analysis
            </a>
          </Card>
          <Card>
            <h3 className="app-info-card__title">Latest writing analysis</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[
                { label: 'Content', value: 75 },
                { label: 'Grammar', value: 74 },
                { label: 'Vocabulary', value: 76 },
                { label: 'Form', value: 80 },
                { label: 'Spelling', value: 88 },
              ].map((item) => (
                <div key={item.label}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '0.875rem',
                      marginBottom: '0.25rem',
                    }}
                  >
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                  </div>
                  <Progress value={item.value} />
                </div>
              ))}
            </div>
            <a href="/feedback/writing" style={{ display: 'inline-block', marginTop: '1rem' }}>
              View full analysis
            </a>
          </Card>
        </div>
      </Container>
    </main>
  );
}
