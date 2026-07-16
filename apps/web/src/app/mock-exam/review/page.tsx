import { Container, Card, Badge, Button } from '@pte-app/design-system';

export const metadata = {
  title: 'Review — PTE Academy',
  description: 'Review your mock exam answers.',
};

export default function MockExamReviewPage() {
  const answers = [
    {
      q: 1,
      task: 'Read Aloud',
      correct: true,
      yourAnswer: 'Recorded response',
      explanation: 'Pacing and pronunciation were accurate.',
    },
    {
      q: 2,
      task: 'Repeat Sentence',
      correct: false,
      yourAnswer: 'Partial recall',
      explanation: 'Missed the final phrase. Focus on memory chunking.',
    },
    {
      q: 3,
      task: 'Describe Image',
      correct: true,
      yourAnswer: 'Recorded response',
      explanation: 'Covered all key trends and comparisons.',
    },
  ];

  return (
    <main>
      <Container>
        <h1 className="app-page-header__title" style={{ marginBottom: '1.5rem' }}>
          Review answers
        </h1>
        <div className="status-grid" style={{ gridTemplateColumns: 'repeat(1, 1fr)' }}>
          {answers.map((ans) => (
            <Card key={ans.q}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '0.75rem',
                }}
              >
                <span style={{ fontWeight: 600 }}>
                  Question {ans.q} · {ans.task}
                </span>
                <Badge variant={ans.correct ? 'success' : 'danger'}>{ans.correct ? 'Correct' : 'Incorrect'}</Badge>
              </div>
              <p style={{ marginBottom: '0.5rem' }}>
                <strong>Your answer:</strong> {ans.yourAnswer}
              </p>
              <p style={{ color: 'var(--color-muted)', fontSize: '0.875rem' }}>{ans.explanation}</p>
            </Card>
          ))}
        </div>
        <div style={{ marginTop: '1.5rem' }}>
          <a href="/mock-exam/results">
            <Button variant="secondary">Back to results</Button>
          </a>
        </div>
      </Container>
    </main>
  );
}
