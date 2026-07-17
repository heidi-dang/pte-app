'use client';

import { useState, useEffect, use } from 'react';
import { Container, Card, Button, Badge, Progress, TextArea, EmptyState } from '@pte-app/design-system';
import { getTaskById } from '@/lib/mock-data';

/* ── Phase I: Attempt lifecycle ──────────────────────────────────────────── */
// TODO(Phase I): Wire startSession to POST /practice/sessions { taskId }
// TODO(Phase I): Wire autosave to PATCH /practice/sessions/:id (debounced)
// TODO(Phase I): Wire submit to POST /practice/sessions/:id/submit
// TODO(Phase I): Wire review to GET /practice/sessions/:id/review
// TODO(Phase R): Connect timer bar persistence and session resume via backend

interface AttemptSession {
  sessionId: string | null;
  startedAt: number | null;
}

export default function PracticeTaskPage({ params }: { params: Promise<{ skill: string; taskId: string }> }) {
  const { taskId } = use(params);
  const task = getTaskById(taskId);
  const [timeLeft, setTimeLeft] = useState(task?.timeLimitSeconds || 60);
  const [isRunning, setIsRunning] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [notes, setNotes] = useState('');
  const [session, setSession] = useState<AttemptSession>({ sessionId: null, startedAt: null });

  // ── Phase I: Start a practice session ───────────────────────────────────
  const startSession = async () => {
    if (!task) return;
    // TODO(Phase I): Replace with real API call
    // const res = await fetch('/api/practice/sessions', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ taskId: task.id }),
    // });
    // const data = await res.json();
    setSession({ sessionId: `mock-${task.id}-${Date.now()}`, startedAt: Date.now() });
    setIsRunning(true);
  };

  // ── Phase I: Autosave (debounced) ───────────────────────────────────────
  useEffect(() => {
    if (!session.sessionId || !isRunning) return;
    const timeout = setTimeout(() => {
      // TODO(Phase I): PATCH /api/practice/sessions/:id with { notes, timeLeft }
      // await fetch(`/api/practice/sessions/${session.sessionId}`, {
      //   method: 'PATCH',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ notes, timeLeft }),
      // });
    }, 2000);
    return () => clearTimeout(timeout);
  }, [notes, timeLeft, session.sessionId, isRunning]);

  // ── Timer ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isRunning || timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(timer);
  }, [isRunning, timeLeft]);

  // ── Phase I: Submit response ────────────────────────────────────────────
  const submitResponse = async () => {
    setIsRunning(false);
    // TODO(Phase I): POST /api/practice/sessions/:id/submit
    // const res = await fetch(`/api/practice/sessions/${session.sessionId}/submit`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ notes, timeSpent: task.timeLimitSeconds - timeLeft }),
    // });
    setSubmitted(true);
  };

  // ── Phase I: Retry (new session) ────────────────────────────────────────
  const retry = () => {
    setSubmitted(false);
    setTimeLeft(task?.timeLimitSeconds || 60);
    setIsRunning(false);
    setSession({ sessionId: null, startedAt: null });
    setNotes('');
  };

  // ── Timer progress (0-100) ──────────────────────────────────────────────
  const timerPct = task ? Math.max(0, (timeLeft / task.timeLimitSeconds) * 100) : 0;
  const timerColor = timerPct > 50 ? '#10b981' : timerPct > 20 ? '#f59e0b' : '#ef4444';

  if (!task) {
    return (
      <main className="task-page">
        <Container>
          <EmptyState icon="📝" title="Task not found" description="The practice task you requested does not exist." />
        </Container>
        <style>{taskStyles}</style>
      </main>
    );
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const feedbackScores = [
    { label: 'Content', value: 78 },
    { label: 'Fluency', value: task.skill === 'Speaking' ? 76 : 74 },
    { label: task.skill === 'Speaking' ? 'Pronunciation' : 'Grammar', value: 72 },
    { label: task.skill === 'Writing' ? 'Vocabulary' : 'Form', value: 75 },
  ];

  return (
    <main className="task-page">
      <Container>
        {/* ── Page Header ──────────────────────────────────────────────── */}
        <div className="task-page-header">
          <div>
            <h1 className="task-page-title">{task.title}</h1>
            <p className="task-page-meta">
              <Badge variant="default">{task.skill}</Badge>
              <Badge
                variant={task.difficulty === 'Easy' ? 'success' : task.difficulty === 'Medium' ? 'warning' : 'danger'}
              >
                {task.difficulty}
              </Badge>
            </p>
          </div>
          <div className="task-page-actions">
            <Button variant="secondary" onClick={() => setBookmarked((b) => !b)}>
              {bookmarked ? '★ Bookmarked' : '☆ Bookmark'}
            </Button>
            <Button variant="secondary" onClick={retry}>
              ↻ Retry
            </Button>
          </div>
        </div>

        {/* ── Timer Bar ────────────────────────────────────────────────── */}
        <div className="task-timer-card">
          <div className="task-timer-info">
            <span className="task-timer-clock" style={{ color: timerColor }}>
              {formatTime(timeLeft)}
            </span>
            <span className="task-timer-label">remaining</span>
          </div>
          <div className="task-timer-track">
            <div className="task-timer-fill" style={{ width: `${timerPct}%`, background: timerColor }} />
          </div>
        </div>

        {/* ── Main Content ─────────────────────────────────────────────── */}
        <div className="task-layout">
          {/* ── Left: Task Panel ──────────────────────────────────────── */}
          <div className="task-main">
            <Card className="task-panel">
              <h3 className="task-panel-heading">Instructions</h3>
              <p className="task-panel-instructions">{task.instructions}</p>

              <div className="task-workspace">
                {task.skill === 'Speaking' && (
                  <div className="task-placeholder">
                    <span className="task-placeholder-icon">🎙️</span>
                    <p>Recording simulation — your microphone will be used when enabled.</p>
                  </div>
                )}
                {task.skill === 'Writing' && (
                  <TextArea
                    placeholder="Type your response here..."
                    rows={12}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                )}
                {task.skill === 'Reading' && (
                  <div className="task-placeholder">
                    <span className="task-placeholder-icon">📄</span>
                    <p>Read the passage and answer the questions below.</p>
                  </div>
                )}
                {task.skill === 'Listening' && (
                  <div className="task-placeholder">
                    <span className="task-placeholder-icon">🔊</span>
                    <p>Audio will play here. Listen carefully before answering.</p>
                  </div>
                )}
              </div>

              <div className="task-controls">
                {!submitted ? (
                  <>
                    <Button onClick={startSession} disabled={isRunning}>
                      {isRunning ? 'Recording...' : 'Start'}
                    </Button>
                    <Button onClick={submitResponse} disabled={!isRunning} variant="secondary">
                      Submit response
                    </Button>
                  </>
                ) : (
                  <Button onClick={retry}>↻ Practice again</Button>
                )}
              </div>
            </Card>
          </div>

          {/* ── Right: Sidebar ────────────────────────────────────────── */}
          <div className="task-sidebar">
            {/* AI Feedback */}
            <Card className="task-sidebar-card">
              <h3 className="task-sidebar-heading">AI Feedback</h3>
              {submitted ? (
                <div className="task-feedback-list">
                  {feedbackScores.map((item) => (
                    <div key={item.label} className="task-feedback-row">
                      <div className="task-feedback-label">
                        <span>{item.label}</span>
                        <strong>{item.value}</strong>
                      </div>
                      <Progress value={item.value} />
                    </div>
                  ))}
                  <div className="task-feedback-tip">
                    <p>
                      Suggestion: Focus on clearer main-point coverage and smoother transitions. Try recording again to
                      compare.
                    </p>
                  </div>
                </div>
              ) : (
                <p className="task-sidebar-muted">Submit your response to see estimated AI feedback.</p>
              )}
            </Card>

            {/* History */}
            <Card className="task-sidebar-card">
              <h3 className="task-sidebar-heading">History</h3>
              <ul className="task-history-list">
                <li>
                  <strong>Today</strong> — Score 74 · 2 attempts
                </li>
                <li className="task-history-muted">Yesterday — Score 70 · 1 attempt</li>
                <li className="task-history-muted">3 days ago — Score 68 · 1 attempt</li>
              </ul>
            </Card>

            {/* Notes */}
            <Card className="task-sidebar-card">
              <h3 className="task-sidebar-heading">Notes</h3>
              <TextArea
                placeholder="Private notes about this task..."
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
              <Button variant="secondary" size="sm" style={{ marginTop: '0.75rem' }}>
                Save notes
              </Button>
            </Card>
          </div>
        </div>
      </Container>

      <style>{taskStyles}</style>
    </main>
  );
}

const taskStyles = `
  .task-page {
    min-height: 100vh;
    padding: 2rem 0 4rem;
    background: var(--color-bg, #0a0f1a);
  }

  /* ── Header ──────────────────────────────────── */
  .task-page-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 1.5rem;
    flex-wrap: wrap;
  }

  .task-page-title {
    font-size: 2rem;
    font-weight: 800;
    letter-spacing: -0.02em;
    color: var(--color-text, #f1f5f9);
    margin: 0 0 0.5rem;
  }

  .task-page-meta {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  .task-page-actions {
    display: flex;
    gap: 0.5rem;
    flex-shrink: 0;
  }

  /* ── Timer ───────────────────────────────────── */
  .task-timer-card {
    background: rgba(15, 23, 42, 0.7);
    border: 1px solid rgba(45, 212, 191, 0.1);
    border-radius: 0.875rem;
    padding: 1rem 1.5rem;
    margin-bottom: 1.5rem;
    display: flex;
    align-items: center;
    gap: 1.5rem;
  }

  .task-timer-info {
    display: flex;
    flex-direction: column;
    min-width: 4.5rem;
  }

  .task-timer-clock {
    font-size: 1.75rem;
    font-weight: 800;
    font-variant-numeric: tabular-nums;
    line-height: 1;
    transition: color 0.3s ease;
  }

  .task-timer-label {
    font-size: 0.7rem;
    color: var(--color-muted, #94a3b8);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-top: 0.25rem;
  }

  .task-timer-track {
    flex: 1;
    height: 0.5rem;
    background: rgba(30, 41, 59, 0.8);
    border-radius: 9999px;
    overflow: hidden;
  }

  .task-timer-fill {
    height: 100%;
    border-radius: 9999px;
    transition: width 1s linear, background 0.5s ease;
  }

  /* ── Layout ──────────────────────────────────── */
  .task-layout {
    display: grid;
    grid-template-columns: 1fr 340px;
    gap: 1.5rem;
    align-items: start;
  }

  @media (max-width: 900px) {
    .task-layout {
      grid-template-columns: 1fr;
    }
  }

  .task-main {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .task-sidebar {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  /* ── Main Panel ──────────────────────────────── */
  .task-panel {
    background: rgba(15, 23, 42, 0.6) !important;
    border: 1px solid rgba(45, 212, 191, 0.1) !important;
    border-radius: 1rem !important;
    padding: 1.75rem !important;
  }

  .task-panel-heading {
    font-size: 1.125rem;
    font-weight: 700;
    color: var(--color-text, #f1f5f9);
    margin: 0 0 0.75rem;
  }

  .task-panel-instructions {
    color: var(--color-text, #cbd5e1);
    line-height: 1.7;
    margin-bottom: 1.5rem;
  }

  .task-workspace {
    margin-bottom: 1.5rem;
  }

  .task-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem 2rem;
    background: rgba(30, 41, 59, 0.4);
    border: 1px dashed rgba(45, 212, 191, 0.2);
    border-radius: 0.875rem;
    text-align: center;
    color: var(--color-muted, #94a3b8);
    font-size: 0.9rem;
  }

  .task-placeholder-icon {
    font-size: 2.5rem;
    margin-bottom: 0.75rem;
    filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.3));
  }

  .task-controls {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  /* ── Sidebar Cards ───────────────────────────── */
  .task-sidebar-card {
    background: rgba(15, 23, 42, 0.6) !important;
    border: 1px solid rgba(45, 212, 191, 0.08) !important;
    border-radius: 1rem !important;
    padding: 1.25rem !important;
  }

  .task-sidebar-heading {
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--color-text, #f1f5f9);
    margin: 0 0 1rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid rgba(45, 212, 191, 0.08);
  }

  .task-sidebar-muted {
    color: var(--color-muted, #94a3b8);
    font-size: 0.85rem;
    line-height: 1.6;
  }

  /* ── Feedback ────────────────────────────────── */
  .task-feedback-list {
    display: flex;
    flex-direction: column;
    gap: 0.875rem;
  }

  .task-feedback-row {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .task-feedback-label {
    display: flex;
    justify-content: space-between;
    font-size: 0.85rem;
    color: var(--color-text, #e2e8f0);
  }

  .task-feedback-label strong {
    color: #2dd4bf;
  }

  .task-feedback-tip {
    margin-top: 0.5rem;
    padding: 0.875rem;
    background: rgba(45, 212, 191, 0.05);
    border: 1px solid rgba(45, 212, 191, 0.1);
    border-radius: 0.625rem;
    font-size: 0.8rem;
    color: var(--color-muted, #94a3b8);
    line-height: 1.6;
  }

  /* ── History ─────────────────────────────────── */
  .task-history-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.625rem;
    font-size: 0.85rem;
    color: var(--color-text, #e2e8f0);
  }

  .task-history-muted {
    color: var(--color-muted, #94a3b8);
  }
`;
