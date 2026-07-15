'use client';

import { useState, useEffect, use } from 'react';
import { Container, Card, Button, Badge, Alert, Progress } from '@pte-app/design-system';
import { InteractiveBlock } from '@/components/InteractiveBlock';
import { api } from '@/lib/phase-h-client';

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

  async function load() {
    setLoading(true);
    try {
      const data = await api.getLesson(id);
      const lessonData = data.lesson as Record<string, unknown>;
      setLesson(lessonData);
      setBlocks((data.blocks as Array<Record<string, unknown>>) || []);
      setProgress((data.progress as Record<string, unknown>) || null);
      setVersionId((lessonData.versionId as string) || '');
      if (data.progress && (data.progress as Record<string, unknown>).blockPosition !== undefined) {
        setCurrentBlock((data.progress as Record<string, unknown>).blockPosition as number);
      }
      if ((data.progress as Record<string, unknown>)?.status === 'completed') setCompleted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Not found');
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

  return (
    <main style={{ paddingTop: '3rem', paddingBottom: '3rem' }}>
      <Container>
        <h1 data-testid="lesson-title">{lesson.title as string}</h1>
        <div style={{ marginBottom: '1rem' }}>
          <Progress value={pct} data-testid="lesson-progress-bar" />
          <span style={{ fontSize: '0.875rem', color: 'var(--color-muted)' }}>{pct}% complete</span>
          {saveStatus !== 'idle' && (
            <span
              data-testid="save-status"
              style={{
                marginLeft: '1rem',
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
                    style={{ marginLeft: '0.5rem', padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                  >
                    Retry
                  </Button>
                </span>
              )}
            </span>
          )}
        </div>
        {block ? (
          <Card data-testid="lesson-block" style={{ marginBottom: '1rem', padding: '1.5rem' }}>
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
                <div style={{ padding: '1rem', background: '#f5f5f5', borderRadius: '4px', textAlign: 'center' }}>
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
                <div style={{ padding: '1rem', background: '#f5f5f5', borderRadius: '4px' }}>
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
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
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
          <Button data-testid="btn-save-progress" onClick={() => saveProgress(currentBlock)}>
            Save Progress
          </Button>
          {currentBlock >= blocks.length - 1 && !completed ? (
            <Button
              data-testid="btn-complete-lesson"
              onClick={handleComplete}
              style={{ background: 'var(--color-success, #2e7d32)' }}
            >
              Complete Lesson
            </Button>
          ) : (
            <Button
              data-testid="btn-next-block"
              disabled={currentBlock >= blocks.length - 1}
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
          {!!(lesson as Record<string, unknown>).quizId && (
            <a
              href={`/learn/quiz/${(lesson as Record<string, unknown>).quizId as string}`}
              style={{ color: 'var(--color-primary)' }}
              data-testid="quiz-link"
            >
              Take Quiz
            </a>
          )}
        </div>
        <div style={{ marginTop: '1rem' }}>
          <a href="/learn/catalogue" style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>
            Back to catalogue
          </a>
        </div>
      </Container>
    </main>
  );
}
