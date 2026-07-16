'use client';

import { useState, useEffect, use, useCallback } from 'react';
import { Container, Card, Button, Badge, Progress, TextArea, EmptyState } from '@pte-app/design-system';
import { getTaskById } from '@/lib/mock-data';
import {
  startAttemptSession,
  submitAttempt,
  autosaveAttempt,
  getAttemptReview,
  getRecordingStatus,
} from '@/lib/client-api';

export default function PracticeTaskPage({ params }: { params: Promise<{ skill: string; taskId: string }> }) {
  const { taskId } = use(params);
  const task = getTaskById(taskId);
  const [timeLeft, setTimeLeft] = useState(task?.timeLimitSeconds || 60);
  const [isRunning, setIsRunning] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [notes, setNotes] = useState('');
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [recordingId, setRecordingId] = useState<string | null>(null);
  const [recordingDuration, setRecordingDuration] = useState<number | null>(null);
  const [reviewData, setReviewData] = useState<unknown>(null);
  const [historyData] = useState<{ date: string; score?: number }[]>([]);
  const [backendError, setBackendError] = useState<string | null>(null);

  const idempotencyKey = `${taskId}-${Date.now()}`;

  useEffect(() => {
    if (!isRunning || timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(timer);
  }, [isRunning, timeLeft]);

  const handleStart = useCallback(async () => {
    setIsRunning(true);
    if (!task) return;
    setBackendError(null);
    const result = await startAttemptSession(
      `standalone-${taskId}`,
      'practice',
      [taskId],
      task.skill === 'Speaking' ? { [taskId]: 'speaking' } : undefined,
    );
    if (!result.ok) {
      setBackendError('Failed to start attempt session. Timer started but progress will not be saved.');
      return;
    }
    setSessionId((result.data.session as Record<string, unknown>)?.id as string);
    const attempts = result.data.attempts as Record<string, unknown>[] | undefined;
    if (attempts && attempts.length > 0 && attempts[0]) {
      setAttemptId(attempts[0].id as string);
    }
  }, [task, taskId]);

  const handleSubmit = useCallback(async () => {
    setIsRunning(false);
    setSubmitted(true);
    setSubmitting(true);
    setBackendError(null);
    if (attemptId) {
      await autosaveAttempt(attemptId, { text: notes, completed: true });
      const submitRes = await submitAttempt(attemptId, { text: notes, completed: true }, idempotencyKey);
      if (!submitRes.ok) {
        setBackendError('Submit to server failed. Response saved locally.');
      } else {
        const reviewRes = await getAttemptReview(attemptId);
        if (reviewRes.ok) {
          setReviewData(reviewRes.data);
        }
        const recordingStatus = await getRecordingStatus(attemptId).catch(() => null);
        if (recordingStatus?.ok && recordingStatus.data.recording?.duration_ms) {
          setRecordingId(recordingStatus.data.recording.id);
          setRecordingDuration(recordingStatus.data.recording.duration_ms / 1000);
        }
      }
    }
    setSubmitting(false);
  }, [attemptId, notes, idempotencyKey]);

  const handleRetry = useCallback(async () => {
    setSubmitted(false);
    setTimeLeft(task?.timeLimitSeconds || 60);
    setIsRunning(false);
    setAttemptId(null);
    setSessionId(null);
    setRecordingId(null);
    setRecordingDuration(null);
    setReviewData(null);
    setBackendError(null);
    setNotes('');
  }, [task]);

  useEffect(() => {
    if (!task || !sessionId) return;
    const interval = setInterval(async () => {
      if (!attemptId || submitted) return;
      await autosaveAttempt(attemptId, { text: notes }).catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, [task, sessionId, attemptId, notes, submitted]);

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
      <h3 className="app-info-card__title">AI feedback</h3>
      {submitted ? (
        reviewData ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-muted)' }}>Status: {(reviewData as Record<string, unknown>).status as string}</p>
            {recordingDuration != null && (
              <p style={{ fontSize: '0.875rem', color: 'var(--color-muted)' }}>
                Recording: {recordingDuration.toFixed(1)}s{recordingId ? ' · uploaded' : ''}
              </p>
            )}
            <p style={{ fontSize: '0.875rem', color: 'var(--color-muted)' }}>
              TODO: Display AI scoring from Phase J scoring service
            </p>
          </div>
        ) : (
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
            <p style={{ fontSize: '0.8rem', color: 'var(--color-muted)', fontStyle: 'italic' }}>
              TODO: Replace with live AI scoring from Phase J scoring API
            </p>
          </div>
        )
      ) : (
        <p style={{ color: 'var(--color-muted)', fontSize: '0.875rem' }}>
          Submit or finish your response to see AI feedback.
        </p>
      )}
      {recordingDuration != null && (
        <div style={{ marginTop: '0.5rem', padding: '0.5rem', background: 'var(--color-surface)', borderRadius: 'var(--radius-sm)' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>
            Recording: {(recordingDuration).toFixed(1)}s · Uploaded
          </p>
        </div>
      )}
      {backendError && (
        <div style={{ marginTop: '0.5rem', padding: '0.5rem', background: 'var(--color-danger-bg, #fef2f2)', borderRadius: 'var(--radius-sm)' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--color-danger, #dc2626)' }}>{backendError}</p>
        </div>
      )}
    </Card>
  );

  const historyPanel = (
    <Card>
      <h3 className="app-info-card__title">History</h3>
      {historyData.length > 0 ? (
        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {historyData.map((h, i) => (
            <li key={i} style={{ fontSize: '0.875rem' }}>
              <strong>{h.date}</strong> — Score {h.score ?? 'N/A'}
            </li>
          ))}
        </ul>
      ) : submitted ? (
        <p style={{ color: 'var(--color-muted)', fontSize: '0.875rem' }}>
          Attempt submitted. Future history will appear here.
        </p>
      ) : (
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
      )}
      <p style={{ fontSize: '0.8rem', color: 'var(--color-muted)', fontStyle: 'italic', marginTop: '0.5rem' }}>
        TODO: Connect to Phase I attempt history API when available
      </p>
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
            <Button onClick={handleRetry}>
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
              <Button onClick={handleStart} disabled={isRunning || submitted}>Start</Button>
              <Button onClick={handleSubmit} disabled={submitted || submitting}>
                {submitting ? 'Submitting...' : 'Submit response'}
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
        <p style={{ fontSize: '0.75rem', color: 'var(--color-muted)', marginTop: '1rem', textAlign: 'center' }}>
          TODO: Replace mock task data with backend lesson/question loading when standalone practice API is built
        </p>
      </Container>
    </main>
  );
}
