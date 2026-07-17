'use client';

import { useState, useEffect } from 'react';
import { Container, Card, Button, Badge, Progress } from '@pte-app/design-system';

const SECTIONS = [
  { name: 'Speaking & Writing', duration: 3300, tasks: 8 },
  { name: 'Reading', duration: 1800, tasks: 5 },
  { name: 'Listening', duration: 3000, tasks: 8 },
];

const QUESTIONS = Array.from({ length: 20 }, (_, i) => i + 1);

export default function ExamPage() {
  const [section, setSection] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const currentSection = SECTIONS[section];
  const [timeLeft, setTimeLeft] = useState(currentSection?.duration ?? 0);
  const [breakMode, setBreakMode] = useState(false);

  useEffect(() => {
    if (breakMode || timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(timer);
  }, [breakMode, timeLeft]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (breakMode) {
    return (
      <main>
        <Container>
          <Card style={{ maxWidth: '36rem', margin: '4rem auto', textAlign: 'center' }}>
            <h2 className="app-page-header__title">Optional break</h2>
            <p className="landing__feature-desc">Relax for a moment. The next section will begin when you are ready.</p>
            <div style={{ fontSize: '3rem', fontWeight: 800, margin: '1.5rem 0', color: 'var(--color-primary)' }}>
              10:00
            </div>
            <Button onClick={() => setBreakMode(false)}>Resume exam</Button>
          </Card>
        </Container>
      </main>
    );
  }

  return (
    <main>
      <Container>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            marginBottom: '1.5rem',
          }}
        >
          <div>
            <h1 className="app-page-header__title">{currentSection?.name}</h1>
            <p className="app-page-header__subtitle">
              Question {currentQuestion + 1} of {QUESTIONS.length}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Badge variant="warning">{formatTime(timeLeft)}</Badge>
            <Button variant="secondary" size="sm" onClick={() => setBreakMode(true)}>
              Break
            </Button>
          </div>
        </div>

        <Progress value={((currentQuestion + 1) / QUESTIONS.length) * 100} />

        <div className="status-grid" style={{ gridTemplateColumns: '1fr', marginTop: '1.5rem' }}>
          <Card>
            <h3 className="app-info-card__title">Question {currentQuestion + 1}</h3>
            <p className="landing__feature-desc" style={{ marginBottom: '1rem' }}>
              {currentSection?.name === 'Speaking & Writing' && 'Read the prompt and record or type your response.'}
              {currentSection?.name === 'Reading' && 'Read the passage and select the best answer.'}
              {currentSection?.name === 'Listening' && 'Listen to the audio and answer the question.'}
            </p>
            <div
              style={{
                padding: '2rem',
                background: 'var(--color-surface)',
                borderRadius: 'var(--radius-lg)',
                border: '1px dashed var(--color-border)',
                textAlign: 'center',
              }}
            >
              <p style={{ color: 'var(--color-muted)' }}>Task content area</p>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: '1.5rem',
                flexWrap: 'wrap',
                gap: '0.75rem',
              }}
            >
              <Button
                variant="secondary"
                disabled={currentQuestion === 0}
                onClick={() => setCurrentQuestion((q) => Math.max(0, q - 1))}
              >
                Previous
              </Button>
              <Button
                onClick={() => {
                  if (currentQuestion < QUESTIONS.length - 1) {
                    setCurrentQuestion((q) => q + 1);
                  } else if (section < SECTIONS.length - 1) {
                    setSection((s) => s + 1);
                    setCurrentQuestion(0);
                    setTimeLeft(SECTIONS[section + 1]?.duration ?? 0);
                  } else {
                    window.location.href = '/mock-exam/results';
                  }
                }}
              >
                {currentQuestion === QUESTIONS.length - 1 && section === SECTIONS.length - 1 ? 'Finish' : 'Next'}
              </Button>
            </div>
          </Card>

          <Card>
            <h3 className="app-info-card__title">Question navigator</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem' }}>
              {QUESTIONS.map((q, i) => (
                <button
                  key={q}
                  onClick={() => setCurrentQuestion(i)}
                  style={{
                    padding: '0.5rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    background: i === currentQuestion ? 'var(--color-primary)' : 'var(--color-surface)',
                    color: i === currentQuestion ? '#fff' : 'var(--color-text)',
                    cursor: 'pointer',
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', flexWrap: 'wrap' }}>
              <Button variant="secondary" size="sm">
                Bookmark
              </Button>
              <Button variant="secondary" size="sm">
                Flag for review
              </Button>
            </div>
          </Card>
        </div>
      </Container>
    </main>
  );
}
