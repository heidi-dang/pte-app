'use client';

import { useState, useEffect, use } from 'react';
import { Container, Card, Button, Badge, Alert, Progress, Tabs, TextArea } from '@pte-app/design-system';
import { InteractiveBlock } from '@/components/InteractiveBlock';
import { api } from '@/lib/phase-h-client';
import { getCourseById, getLessonById } from '@/lib/mock-data';

export default function LessonViewerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [lesson, setLesson] = useState<Record<string, unknown> | null>(null);
  const [blocks, setBlocks] = useState<Array<Record<string, unknown>>>([]);
  const [progress, setProgress] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentBlock, setCurrentBlock] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'failed'>('idle');
  const [versionId, setVersionId] = useState<string>('');
  const [lastMutId, setLastMutId] = useState<string>('');
  const [teacherNotes, setTeacherNotes] = useState<Array<Record<string, unknown>>>([]);
  const [quiz, setQuiz] = useState<Record<string, unknown> | null>(null);
  const [notes, setNotes] = useState('');
  const [usingMock, setUsingMock] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await api.getLesson(id);
      const lessonData = data.lesson as Record<string, unknown>;
      setLesson(lessonData);
      setBlocks((data.blocks as Array<Record<string, unknown>>) || []);
      setProgress((data.progress as Record<string, unknown>) || null);
      setTeacherNotes((data.teacherNotes as Array<Record<string, unknown>>) || []);
      setQuiz((data.quiz as Record<string, unknown>) || null);
      setVersionId((lessonData.versionId as string) || '');
      if (data.progress && (data.progress as Record<string, unknown>).blockPosition !== undefined) {
        setCurrentBlock((data.progress as Record<string, unknown>).blockPosition as number);
      }
      if ((data.progress as Record<string, unknown>)?.status === 'completed') setCompleted(true);
      setUsingMock(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Not found');
      // Fallback to mock data
      const mockLesson = getLessonById(id);
      if (mockLesson) {
        const course = getCourseById(mockLesson.courseId);
        setLesson({
          id: mockLesson.id,
          title: mockLesson.title,
          description: mockLesson.summary,
          courseTitle: course?.title || 'PTE Course',
        } as Record<string, unknown>);
        setBlocks([
          { id: 'b-1', blockType: 'text', title: 'Introduction', content: { body: mockLesson.summary } },
          { id: 'b-2', blockType: 'video', title: 'Video lesson', content: { title: mockLesson.title, transcript: 'In this lesson we explore the key strategies for this task type.' } },
          { id: 'b-3', blockType: 'audio', title: 'Audio example', content: { title: 'Sample audio', transcript: 'Audio transcript: example response for this task.' } },
          { id: 'b-4', blockType: 'interactive', title: 'Interactive check', content: { type: 'reveal', front: 'What is the most important element?', back: 'Fluency and clear pronunciation.' } },
        ]);
        setProgress({ status: 'in_progress', blockPosition: 0 });
        setQuiz({ id: 'q-1' });
        setUsingMock(true);
        setError('');
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  async function saveProgress(blockIdx: number, reuseMutId?: boolean) {
    const mutId =
      reuseMutId && lastMutId ? lastMutId : `progress-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    if (!reuseMutId) setLastMutId(mutId);
    setSaveStatus('saving');
    try {
      if (usingMock) {
        setProgress({ status: 'in_progress', blockPosition: blockIdx });
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
        return;
      }
      const data = await api.updateProgress({
        lessonId: id,
        mutationId: mutId,
        lessonVersionId: versionId,
        blockId: blocks[blockIdx]?.id,
        blockPosition: blockIdx,
      });
      setProgress(data);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch {
      setSaveStatus('failed');
    }
  }

  async function handleComplete() {
    setSaveStatus('saving');
    try {
      if (usingMock) {
        setCompleted(true);
        setProgress({ status: 'completed' });
        setSaveStatus('saved');
        return;
      }
      const data = await api.completeLesson(id);
      setCompleted(true);
      setProgress(data.progress as Record<string, unknown>);
      setSaveStatus('saved');
    } catch {
      setSaveStatus('failed');
    }
  }

  if (loading)
    return (
      <Container>
        <p data-testid="lesson-loading">Loading lesson...</p>
      </Container>
    );
  if (error)
    return (
      <Container>
        <Alert data-testid="lesson-error">{error}</Alert>
      </Container>
    );
  if (!lesson)
    return (
      <Container>
        <Alert>Lesson not found</Alert>
      </Container>
    );

  const block = blocks[currentBlock];
  const pct = blocks.length > 0 ? Math.round(((currentBlock + 1) / blocks.length) * 100) : 0;

  const contentTab = (
    <div>
      <div style={{ marginBottom: '1rem' }}>
        <Progress value={pct} data-testid="lesson-progress-bar" />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.875rem', color: 'var(--color-muted)' }}>{pct}% complete</span>
          {saveStatus !== 'idle' && (
            <span
              data-testid="save-status"
              style={{
                fontSize: '0.875rem',
                color: saveStatus === 'failed' ? 'var(--color-error, red)' : 'var(--color-muted)',
              }}
            >
              {saveStatus === 'saving' && 'Saving...'}
              {saveStatus === 'saved' && 'Saved'}
              {saveStatus === 'failed' && (
                <span>
                  Save failed.{' '}
                  <Button
                    data-testid="retry-save"
                    onClick={() => saveProgress(currentBlock, true)}
                    size="sm"
                    style={{ marginLeft: '0.5rem' }}
                  >
                    Retry
                  </Button>
                </span>
              )}
            </span>
          )}
        </div>
      </div>
      {block ? (
        <Card data-testid="lesson-block" style={{ marginBottom: '1rem' }}>
          {(block.blockType as string) === 'text' && (
            <div data-testid="block-text">
              <h2>{block.title as string}</h2>
              <div style={{ lineHeight: '1.6' }}>
                {((block.content as Record<string, unknown>)?.body as string) || 'Lesson content'}
              </div>
            </div>
          )}
          {(block.blockType as string) === 'video' && (
            <div data-testid="block-video">
              <h2>{block.title as string}</h2>
              <div style={{ padding: '1rem', background: 'var(--color-surface)', borderRadius: 'var(--radius-md)', textAlign: 'center', border: '1px solid var(--color-border)' }}>
                Video content: {((block.content as Record<string, unknown>)?.title as string) || 'Untitled'}
              </div>
              {(block.content as Record<string, unknown>)?.transcript != null && (
                <details style={{ marginTop: '0.75rem' }}>
                  <summary style={{ cursor: 'pointer', color: 'var(--color-primary)' }}>Transcript</summary>
                  <p style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
                    {(block.content as Record<string, unknown>).transcript as string}
                  </p>
                </details>
              )}
            </div>
          )}
          {(block.blockType as string) === 'audio' && (
            <div data-testid="block-audio">
              <h2>{block.title as string}</h2>
              <div style={{ padding: '1rem', background: 'var(--color-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                Audio content: {((block.content as Record<string, unknown>)?.title as string) || 'Untitled'}
                <p style={{ fontSize: '0.8rem', color: 'var(--color-muted)' }}>Audio playback available</p>
              </div>
              {(block.content as Record<string, unknown>)?.transcript != null && (
                <details style={{ marginTop: '0.75rem' }}>
                  <summary style={{ cursor: 'pointer', color: 'var(--color-primary)' }}>Transcript</summary>
                  <p style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
                    {(block.content as Record<string, unknown>).transcript as string}
                  </p>
                </details>
              )}
            </div>
          )}
          {(block.blockType as string) === 'interactive' && (
            <div data-testid="block-interactive">
              <InteractiveBlock content={block.content as Record<string, unknown>} blockType="interactive" />
            </div>
          )}
        </Card>
      ) : (
        <Card>
          <p>No content available</p>
        </Card>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <Button
          data-testid="btn-prev-block"
          disabled={currentBlock === 0}
          onClick={() => {
            const prev = Math.max(0, currentBlock - 1);
            setCurrentBlock(prev);
            saveProgress(prev);
          }}
        >
          Previous
        </Button>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Button data-testid="btn-save-progress" variant="secondary" onClick={() => saveProgress(currentBlock)}>
            Save Progress
          </Button>
          {!completed && progress && progress.status !== 'not_started' && (
            <Button
              data-testid="btn-complete-lesson"
              onClick={handleComplete}
            >
              Complete Lesson
            </Button>
          )}
          {currentBlock < blocks.length - 1 && blocks.length > 0 && (
            <Button
              data-testid="btn-next-block"
              onClick={() => {
                const next = Math.min(blocks.length - 1, currentBlock + 1);
                setCurrentBlock(next);
                saveProgress(next);
              }}
            >
              Next
            </Button>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        {progress && (
          <Badge
            variant={
              completed
                ? 'success'
                : (progress as Record<string, unknown>).status === 'completed'
                  ? 'success'
                  : 'warning'
            }
            data-testid="progress-status"
          >
            {completed ? 'completed' : (progress.status as string)}
          </Badge>
        )}
        {completed && (
          <Badge variant="success" data-testid="completion-badge">
            Lesson Completed!
          </Badge>
        )}
        {quiz && (
          <a
            href={`/learn/quiz/${quiz.id as string}`}
            style={{ color: 'var(--color-primary)' }}
            data-testid="quiz-link"
          >
            Take Quiz
          </a>
        )}
      </div>
      {teacherNotes.length > 0 && (
        <div
          style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' }}
          data-testid="teacher-notes"
        >
          <h3 style={{ marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--color-muted)' }}>Teacher Notes</h3>
          {teacherNotes.map((note, i) => (
            <div key={i} data-testid="teacher-note" style={{ marginBottom: '0.5rem' }}>
              <p>{note.content as string}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const notesTab = (
    <Card>
      <h3 className="app-info-card__title">My notes</h3>
      <TextArea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Write your lesson notes here..."
        rows={8}
      />
      <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem' }}>
        <Button onClick={() => {}}>Save notes</Button>
        <Button variant="secondary">Download PDF</Button>
      </div>
    </Card>
  );

  const transcriptTab = (
    <Card>
      <h3 className="app-info-card__title">Transcript</h3>
      <p style={{ color: 'var(--color-muted)', lineHeight: '1.6' }}>
        Full transcript is available below the video player. In this lesson, we covered the key strategies for the task
        type, common mistakes, and a worked example to help you apply the technique in your next practice session.
      </p>
    </Card>
  );

  const downloadsTab = (
    <Card>
      <h3 className="app-info-card__title">Downloads</h3>
      <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <li>
          <Button variant="secondary" size="sm">Lesson slides (PDF)</Button>
        </li>
        <li>
          <Button variant="secondary" size="sm">Practice worksheet</Button>
        </li>
        <li>
          <Button variant="secondary" size="sm">Audio transcript</Button>
        </li>
      </ul>
    </Card>
  );

  return (
    <main>
      <Container>
        <h1 data-testid="lesson-title" className="app-page-header__title" style={{ marginBottom: '0.5rem' }}>{lesson.title as string}</h1>
        <p style={{ color: 'var(--color-muted)', marginBottom: '1.5rem' }}>
          {lesson.courseTitle as string}
        </p>
        <Tabs
          defaultTab="content"
          tabs={[
            { id: 'content', label: 'Lesson', content: contentTab },
            { id: 'notes', label: 'Notes', content: notesTab },
            { id: 'transcript', label: 'Transcript', content: transcriptTab },
            { id: 'downloads', label: 'Downloads', content: downloadsTab },
          ]}
        />
        <div style={{ marginTop: '1.5rem' }}>
          <a href="/learn/catalogue" style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>
            Back to catalogue
          </a>
        </div>
      </Container>
    </main>
  );
}
