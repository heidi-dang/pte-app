'use client';

import { Container, Card, Button, Badge } from '@pte-app/design-system';

export default function ExamLobbyPage() {
  const checks = [
    { label: 'Browser compatibility', status: 'ok' as const },
    { label: 'Microphone check', status: 'ok' as const },
    { label: 'Headphone check', status: 'ok' as const },
    { label: 'Camera check', status: 'warning' as const },
  ];

  return (
    <main>
      <Container>
        <h1 className="app-page-header__title" style={{ marginBottom: '0.5rem' }}>
          Exam lobby
        </h1>
        <p className="app-page-header__subtitle" style={{ marginBottom: '1.5rem' }}>
          Complete the device checks before starting your mock exam.
        </p>

        <div className="status-grid" style={{ gridTemplateColumns: 'repeat(1, 1fr)', marginBottom: '1.5rem' }}>
          {checks.map((check) => (
            <Card key={check.label}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>{check.label}</span>
                <Badge variant={check.status === 'ok' ? 'success' : 'warning'}>
                  {check.status === 'ok' ? 'Ready' : 'Check recommended'}
                </Badge>
              </div>
              {check.label.includes('Microphone') && (
                <div style={{ marginTop: '1rem' }}>
                  <div
                    style={{
                      height: '0.5rem',
                      background: 'var(--color-surface)',
                      borderRadius: '9999px',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: '70%',
                        height: '100%',
                        background: 'var(--color-primary)',
                        borderRadius: '9999px',
                      }}
                    />
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-muted)', marginTop: '0.25rem' }}>
                    Speak to test your microphone level
                  </p>
                </div>
              )}
            </Card>
          ))}
        </div>

        <Card style={{ maxWidth: '40rem', margin: '0 auto', textAlign: 'center' }}>
          <h3 className="app-info-card__title">Ready to begin?</h3>
          <p className="landing__feature-desc" style={{ marginBottom: '1.5rem' }}>
            You will have 2 hours to complete the exam. Do not refresh the page.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
            <a href="/mock-exam/exam">
              <Button>Start exam</Button>
            </a>
          </div>
        </Card>
      </Container>
    </main>
  );
}
