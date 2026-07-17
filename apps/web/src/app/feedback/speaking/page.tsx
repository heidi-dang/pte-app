import { Container, Card, Badge, Progress } from '@pte-app/design-system';

export const metadata = {
  title: 'Speaking Analysis — PTE Academy',
  description: 'Detailed AI speaking feedback.',
};

export default function SpeakingFeedbackPage() {
  return (
    <main>
      <Container>
        <h1 className="app-page-header__title" style={{ marginBottom: '1.5rem' }}>
          Speaking analysis
        </h1>
        <div className="status-grid" style={{ gridTemplateColumns: 'repeat(1, 1fr)' }}>
          <Card>
            <h3 className="app-info-card__title">Score breakdown</h3>
            {[
              { label: 'Content', value: 78 },
              { label: 'Fluency', value: 76 },
              { label: 'Pronunciation', value: 72 },
            ].map((item) => (
              <div key={item.label} style={{ marginBottom: '0.75rem' }}>
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
            <div style={{ marginTop: '1rem' }}>
              <Badge variant="success">High confidence</Badge>
            </div>
          </Card>
          <Card>
            <h3 className="app-info-card__title">Improvement suggestions</h3>
            <ul
              style={{
                listStyle: 'disc',
                paddingLeft: '1.25rem',
                color: 'var(--color-muted)',
                fontSize: '0.875rem',
                lineHeight: '1.6',
              }}
            >
              <li>Reduce hesitations by practising with shorter chunks first.</li>
              <li>Stress the final word of each sentence more clearly.</li>
              <li>Use intonation to mark list items and contrasts.</li>
              <li>Record yourself daily and compare against the model response.</li>
            </ul>
          </Card>
        </div>
      </Container>
    </main>
  );
}
