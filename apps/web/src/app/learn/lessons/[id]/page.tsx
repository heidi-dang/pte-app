'use client';

import { useState, useEffect, use } from 'react';
import { Container, Card, Button, Badge, Alert, Progress } from '@pte-app/design-system';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function LessonViewerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [lesson, setLesson] = useState<Record<string, unknown> | null>(null);
  const [blocks, setBlocks] = useState<Array<Record<string, unknown>>>([]);
  const [progress, setProgress] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentBlock, setCurrentBlock] = useState(0);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/learn/lessons/${id}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Lesson not found');
      const data = await res.json();
      setLesson(data.lesson as Record<string, unknown>);
      setBlocks((data.blocks as Array<Record<string, unknown>>) || []);
      setProgress(data.progress as Record<string, unknown> || null);
      if (data.progress && (data.progress as Record<string, unknown>).blockPosition) {
        setCurrentBlock((data.progress as Record<string, unknown>).blockPosition as number);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Not found');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [id]);

  async function saveProgress(blockIdx: number) {
    const mutationId = `progress-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const pct = blocks.length > 0 ? Math.round(((blockIdx + 1) / blocks.length) * 100) : 0;
    try {
      const res = await fetch(`${API_URL}/learn/progress`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId: id, blockId: blocks[blockIdx]?.id, blockPosition: blockIdx,
          progressPercentage: pct, mutationId, lessonVersionId: 'v1',
          courseId: lesson?.courseId, moduleId: lesson?.moduleId,
        }),
      });
      if (res.ok) setProgress(await res.json());
    } catch { /* best-effort progress save */ }
  }

  if (loading) return <Container><p data-testid="lesson-loading">Loading lesson...</p></Container>;
  if (error) return <Container><Alert data-testid="lesson-error">{error}</Alert></Container>;
  if (!lesson) return <Container><Alert>Lesson not found</Alert></Container>;

  const block = blocks[currentBlock];
  const pct = blocks.length > 0 ? Math.round(((currentBlock + 1) / blocks.length) * 100) : 0;

  return (
    <main style={{ paddingTop: '3rem', paddingBottom: '3rem' }}>
      <Container>
        <h1 data-testid="lesson-title">{lesson.title as string}</h1>
        <div style={{ marginBottom: '1rem' }}>
          <Progress value={pct} data-testid="lesson-progress-bar" />
          <span style={{ fontSize: '0.875rem', color: 'var(--color-muted)' }}>{pct}% complete</span>
        </div>
        {block ? (
          <Card data-testid="lesson-block" style={{ marginBottom: '1rem', padding: '1.5rem' }}>
            {(block.blockType as string) === 'text' && (
              <div data-testid="block-text">
                <h2>{block.title as string}</h2>
                <div style={{ lineHeight: '1.6' }}>{(block.content as Record<string, unknown>)?.body as string || 'Lesson content'}</div>
              </div>
            )}
            {(block.blockType as string) === 'video' && (
              <div data-testid="block-video">
                <h2>{block.title as string}</h2>
                <div style={{ padding: '1rem', background: '#f5f5f5', borderRadius: '4px', textAlign: 'center' }}>
                  Video content: {(block.content as Record<string, unknown>)?.title as string || 'Untitled'}
                </div>
              </div>
            )}
            {(block.blockType as string) === 'audio' && (
              <div data-testid="block-audio">
                <h2>{block.title as string}</h2>
                <div style={{ padding: '1rem', background: '#f5f5f5', borderRadius: '4px' }}>
                  Audio content: {(block.content as Record<string, unknown>)?.title as string || 'Untitled'}
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-muted)' }}>Transcript available</p>
                </div>
              </div>
            )}
            {(block.blockType as string) === 'interactive' && (
              <div data-testid="block-interactive">
                <h2>{block.title as string}</h2>
                <div style={{ padding: '1rem', background: '#eef6ff', borderRadius: '4px' }}>
                  Interactive activity: {(block.content as Record<string, unknown>)?.title as string || 'Untitled'}
                </div>
              </div>
            )}
          </Card>
        ) : (
          <Card><p>No content available</p></Card>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <Button
            data-testid="btn-prev-block"
            disabled={currentBlock === 0}
            onClick={() => { const prev = Math.max(0, currentBlock - 1); setCurrentBlock(prev); saveProgress(prev); }}>
            Previous
          </Button>
          <Button
            data-testid="btn-save-progress"
            onClick={() => saveProgress(currentBlock)}>
            Save Progress
          </Button>
          <Button
            data-testid="btn-next-block"
            disabled={currentBlock >= blocks.length - 1}
            onClick={() => { const next = Math.min(blocks.length - 1, currentBlock + 1); setCurrentBlock(next); saveProgress(next); }}>
            Next
          </Button>
        </div>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {progress && (
            <Badge variant={(progress as Record<string, unknown>).status === 'completed' ? 'success' : 'warning'} data-testid="progress-status">
              {(progress as Record<string, unknown>).status as string}
            </Badge>
          )}
          {(!!(lesson as Record<string, unknown>).quizId) && (
            <a href={`/learn/quiz/${(lesson as Record<string, unknown>).quizId as string}`} style={{ color: 'var(--color-primary)' }} data-testid="quiz-link">
              Take Quiz
            </a>
          )}
        </div>
        <div style={{ marginTop: '1rem' }}>
          <a href="/learn/catalogue" style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>Back to catalogue</a>
        </div>
      </Container>
    </main>
  );
}
