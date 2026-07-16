'use client';

import { useState, useEffect, use } from 'react';
import { Container, Card, Button, Badge, Progress, TextArea, EmptyState } from '@pte-app/design-system';
import { getTaskById } from '@/lib/mock-data';

export default function PracticeTaskPage({ params }: { params: Promise<{ skill: string; taskId: string }> }) {
  const { taskId } = use(params);
  const task = getTaskById(taskId);
  const [timeLeft, setTimeLeft] = useState(task?.timeLimitSeconds || 60);
  const [isRunning, setIsRunning] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!isRunning || timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(timer);
  }, [isRunning, timeLeft]);

  if (!task) {
    return (
      <main>
        <Container>
          <EmptyState icon="📝" title="Task not found" description="The practice task you requested does not exist." />
        </Container>
      </main>
    );
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const aiFeedbackPanel = (
    <Card>
      <h3 className="app-info-card__title">Estimated AI feedback</h3>
      {submitted ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {[
            { label: 'Content', value: 78 },
            { label: 'Fluency', value: task.skill === 'Speaking' ? 76 : 74 },
            { label: task.skill === 'Speaking' ? 'Pronunciation' : 'Grammar', value: 72 },
            { label: task.skill === 'Writing' ? 'Vocabulary' : 'Form', value: 75 },
          ].map((item) => (
            <div key={item.label}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
              <Progress value={item.value} />
            </div>
          ))}
          <div style={{ marginTop: '0.5rem', padding: '0.75rem', background: 'var(--color-surface)', borderRadius: 'var(--radius-md)' }}>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-muted)' }}>
              Suggestion: Focus on clearer main-point coverage and smoother transitions. Try recording again to compare.
            </p>
          </div>
        </div>
      ) : (
        <p style={{ color: 'var(--color-muted)', fontSize: '0.875rem' }}>
          Submit or finish your response to see AI feedback.
        </p>
      )}
    </Card>
  );

  const historyPanel = (
    <Card>
      <h3 className="app-info-card__title">History</h3>
      <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <li style={{ fontSize: '0.875rem' }}>
          <strong>Today</strong> — Score 74 · 2 attempts
        </li>
        <li style={{ fontSize: '0.875rem', color: 'var(--color-muted)' }}>
          Yesterday — Score 70 · 1 attempt
        </li>
        <li style={{ fontSize: '0.875rem', color: 'var(--color-muted)' }}>
          3 days ago — Score 68 · 1 attempt
        </li>
      </ul>
    </Card>
  );

  return (
    <main>
      <Container>
        <div className="app-page-header">
          <div>
            <h1 className="app-page-header__title">{task.title}</h1>
            <p className="app-page-header__subtitle">{task.type} · {task.skill}</p>
          </div>
          <div className="app-page-header__actions">
            <Button variant="secondary" onClick={() => setBookmarked((b) => !b)}>
              {bookmarked ? 'Bookmarked' : 'Bookmark'}
            </Button>
            <Button onClick={() => { setSubmitted(false); setTimeLeft(task.timeLimitSeconds); setIsRunning(false); }}>
              Retry
            </Button>
          </div>
        </div>

        <div className="status-grid" style={{ gridTemplateColumns: 'repeat(1, 1fr)', marginBottom: '1.5rem' }}>
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <Badge variant={task.difficulty === 'Easy' ? 'success' : task.difficulty === 'Medium' ? 'warning' : 'danger'}>{task.difficulty}</Badge>
                <Badge>{formatTime(timeLeft)}</Badge>
              </div>
              <Progress value={Math.max(0, (timeLeft / task.timeLimitSeconds) * 100)} />
            </div>
          </Card>
        </div>

        <div className="status-grid" style={{ gridTemplateColumns: '1fr', alignItems: 'start' }}>
          <Card>
            <h3 className="app-info-card__title">Instructions</h3>
            <p style={{ color: 'var(--color-text)', marginBottom: '1rem' }}>{task.instructions}</p>
            <div style={{ padding: '1.5rem', background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--color-border)', marginBottom: '1rem' }}>
              <p style={{ color: 'var(--color-muted)', textAlign: 'center' }}>
                {task.skill === 'Speaking' && 'Recording simulation — your microphone will be used when enabled.'}
                {task.skill === 'Writing' && 'Type your response in the area below.'}
                {task.skill === 'Reading' && 'Read the passage and answer the questions.'}
                {task.skill === 'Listening' && 'Audio will play here. Listen carefully before answering.'}
              </p>
            </div>
            {task.skill === 'Writing' && (
              <TextArea
                placeholder="Type your response here..."
                rows={10}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            )}
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', flexWrap: 'wrap' }}>
              <Button onClick={() => setIsRunning(true)} disabled={isRunning || submitted}>Start</Button>
              <Button onClick={() => { setIsRunning(false); setSubmitted(true); }} disabled={submitted}>
                Submit response
              </Button>
            </div>
          </Card>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {aiFeedbackPanel}
            {historyPanel}
            <Card>
              <h3 className="app-info-card__title">Notes</h3>
              <TextArea
                placeholder="Private notes about this task..."
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
              <Button variant="secondary" size="sm" style={{ marginTop: '0.75rem' }}>Save notes</Button>
            </Card>
          </div>
        </div>
      </Container>
    </main>
  );
}
