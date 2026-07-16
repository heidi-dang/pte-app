import { Container, Card, Badge, Progress } from '@pte-app/design-system';

export const metadata = {
  title: 'Writing Analysis — PTE Academy',
  description: 'Detailed AI writing feedback.',
};

export default function WritingFeedbackPage() {
  return (
    <main>
      <Container>
        <h1 className="app-page-header__title" style={{ marginBottom: '1.5rem' }}>Writing analysis</h1>
        <div className="status-grid" style={{ gridTemplateColumns: 'repeat(1, 1fr)' }}>
          <Card>
            <h3 className="app-info-card__title">Score breakdown</h3>
            {[
              { label: 'Content', value: 75 },
              { label: 'Form', value: 80 },
              { label: 'Structure & coherence', value: 78 },
              { label: 'Grammar', value: 74 },
              { label: 'Vocabulary', value: 76 },
              { label: 'Spelling', value: 88 },
            ].map((item) => (
              <div key={item.label} style={{ marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
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
            <ul style={{ listStyle: 'disc', paddingLeft: '1.25rem', color: 'var(--color-muted)', fontSize: '0.875rem', lineHeight: '1.6' }}>
              <li>Use more academic transition words such as &ldquo;furthermore&rdquo; and &ldquo;consequently&rdquo;.</li>
              <li>Vary sentence structure to include more complex sentences.</li>
              <li>Check subject-verb agreement in long sentences.</li>
              <li>Expand your lexical range by replacing common words with synonyms.</li>
            </ul>
          </Card>
        </div>
      </Container>
    </main>
  );
}
