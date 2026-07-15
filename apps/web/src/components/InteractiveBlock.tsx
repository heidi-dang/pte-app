'use client';

import { useState, useCallback } from 'react';
import { Button } from '@pte-app/design-system';

interface InteractiveBlockProps {
  content: Record<string, unknown>;
  blockType: string;
}

export function InteractiveBlock({ content, blockType }: InteractiveBlockProps) {
  if (blockType !== 'interactive') return null;

  const interactionType = (content.interactionType as string) || 'reveal';

  switch (interactionType) {
    case 'reveal':
      return <RevealBlock content={content} />;
    case 'flashcard':
      return <FlashcardBlock content={content} />;
    case 'matching':
      return <MatchingBlock content={content} />;
    case 'ordering':
      return <OrderingBlock content={content} />;
    default:
      return <RevealBlock content={content} />;
  }
}

function RevealBlock({ content }: { content: Record<string, unknown> }) {
  const [revealed, setRevealed] = useState(false);
  const prompt = (content.prompt as string) || 'Click to reveal';
  const hidden = (content.hidden as string) || 'Content';

  return (
    <div data-testid="interactive-reveal" role="region" aria-label="Reveal interaction">
      <p style={{ marginBottom: '0.75rem' }}>{prompt}</p>
      {!revealed ? (
        <Button data-testid="reveal-button" onClick={() => setRevealed(true)} aria-label="Reveal content">
          Reveal
        </Button>
      ) : (
        <div
          data-testid="reveal-content"
          style={{ padding: '1rem', background: '#eef6ff', borderRadius: '8px', border: '1px solid #bdd7ee' }}
        >
          <p style={{ fontStyle: 'italic' }}>{hidden}</p>
        </div>
      )}
    </div>
  );
}

function FlashcardBlock({ content }: { content: Record<string, unknown> }) {
  const [flipped, setFlipped] = useState(false);
  const front = (content.front as string) || 'Front';
  const back = (content.back as string) || 'Back';

  return (
    <div data-testid="interactive-flashcard" role="region" aria-label="Flashcard interaction">
      <div
        onClick={() => setFlipped(!flipped)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setFlipped(!flipped);
          }
        }}
        tabIndex={0}
        role="button"
        aria-label={flipped ? `Answer: ${back}. Click to flip back.` : `Question: ${front}. Click to reveal answer.`}
        style={{
          minHeight: '120px',
          padding: '1.5rem',
          background: flipped ? '#fff3e0' : '#e3f2fd',
          borderRadius: '12px',
          border: `2px solid ${flipped ? '#ffcc80' : '#90caf9'}`,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          transition: 'all 0.3s ease',
          userSelect: 'none',
        }}
      >
        <div>
          <p style={{ fontSize: '0.75rem', color: '#666', marginBottom: '0.5rem' }}>
            {flipped ? 'Answer' : 'Question'} (click to flip)
          </p>
          <p data-testid="flashcard-text" style={{ fontSize: '1.1rem', fontWeight: 500 }}>
            {flipped ? back : front}
          </p>
        </div>
      </div>
    </div>
  );
}

function MatchingBlock({ content }: { content: Record<string, unknown> }) {
  const pairs = (content.pairs as Array<{ left: string; right: string }>) || [];
  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [feedback, setFeedback] = useState('');

  const rightIndexOffset = pairs.length;
  const leftItems = pairs.map((p, i) => ({ text: p.left, idx: i }));
  const rightItems = [...pairs.map((p, i) => ({ text: p.right, originalIdx: i }))]
    .sort(() => Math.random() - 0.5)
    .map((item, displayIdx) => ({ ...item, idx: displayIdx }));

  const handleLeftClick = useCallback((idx: number) => {
    setSelectedLeft(idx);
    setFeedback('');
  }, []);

  const handleRightClick = useCallback(
    (displayIdx: number) => {
      if (selectedLeft === null) return;
      const originalIdx = rightItems[displayIdx]?.originalIdx;
      if (originalIdx === undefined) return;
      if (pairs[selectedLeft]?.right === pairs[originalIdx]?.right) {
        setMatched((prev) => new Set([...prev, selectedLeft, displayIdx + rightIndexOffset]));
        setFeedback('Correct match!');
      } else {
        setFeedback('Try again');
      }
      setSelectedLeft(null);
    },
    [selectedLeft, pairs, rightIndexOffset, rightItems],
  );

  return (
    <div data-testid="interactive-matching" role="region" aria-label="Matching interaction">
      <p style={{ marginBottom: '0.75rem' }}>{(content.instructions as string) || 'Match the pairs:'}</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
        <div>
          {leftItems.map(({ text, idx }) => (
            <button
              key={idx}
              data-testid={`match-left-${idx}`}
              onClick={() => handleLeftClick(idx)}
              disabled={matched.has(idx)}
              aria-label={`Match item: ${text}`}
              style={{
                display: 'block',
                width: '100%',
                padding: '0.5rem',
                marginBottom: '0.25rem',
                background: selectedLeft === idx ? '#bbdefb' : matched.has(idx) ? '#c8e6c9' : '#f5f5f5',
                border: `2px solid ${selectedLeft === idx ? '#1976d2' : matched.has(idx) ? '#388e3c' : '#ddd'}`,
                borderRadius: '6px',
                cursor: matched.has(idx) ? 'default' : 'pointer',
                textAlign: 'left',
              }}
            >
              {text}
            </button>
          ))}
        </div>
        <div>
          {rightItems.map(({ text, idx }) => (
            <button
              key={idx}
              data-testid={`match-right-${idx}`}
              onClick={() => handleRightClick(idx)}
              disabled={matched.has(idx + rightIndexOffset)}
              aria-label={`Match option: ${text}`}
              style={{
                display: 'block',
                width: '100%',
                padding: '0.5rem',
                marginBottom: '0.25rem',
                background: matched.has(idx + rightIndexOffset) ? '#c8e6c9' : '#f5f5f5',
                border: `2px solid ${matched.has(idx + rightIndexOffset) ? '#388e3c' : '#ddd'}`,
                borderRadius: '6px',
                cursor: matched.has(idx + rightIndexOffset) ? 'default' : 'pointer',
                textAlign: 'left',
              }}
            >
              {text}
            </button>
          ))}
        </div>
      </div>
      {feedback && (
        <p
          data-testid="match-feedback"
          style={{ marginTop: '0.5rem', color: feedback.includes('Correct') ? '#2e7d32' : '#c62828' }}
        >
          {feedback}
        </p>
      )}
      {matched.size >= pairs.length * 2 && (
        <p data-testid="match-complete" style={{ marginTop: '0.5rem', color: '#2e7d32', fontWeight: 600 }}>
          All pairs matched!
        </p>
      )}
    </div>
  );
}

function OrderingBlock({ content }: { content: Record<string, unknown> }) {
  const items = (content.items as string[]) || [];
  const instructions = (content.instructions as string) || 'Arrange in the correct order:';
  const correctOrder = (content.correctOrder as number[]) || items.map((_, i) => i);

  const [order, setOrder] = useState<number[]>(() => {
    const initial = items.map((_, i) => i);
    for (let i = initial.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const a = initial[i];
      const b = initial[j];
      if (a !== undefined && b !== undefined) {
        [initial[i], initial[j]] = [b, a];
      }
    }
    return initial;
  });
  const [submitted, setSubmitted] = useState(false);
  const isCorrect = order.every((val, idx) => val === correctOrder[idx]);

  const moveUp = (idx: number) => {
    if (idx === 0) return;
    const a = order[idx - 1];
    const b = order[idx];
    if (a !== undefined && b !== undefined) {
      const newOrder = [...order];
      [newOrder[idx - 1], newOrder[idx]] = [b, a];
      setOrder(newOrder);
    }
  };

  const moveDown = (idx: number) => {
    if (idx === order.length - 1) return;
    const a = order[idx + 1];
    const b = order[idx];
    if (a !== undefined && b !== undefined) {
      const newOrder = [...order];
      [newOrder[idx + 1], newOrder[idx]] = [b, a];
      setOrder(newOrder);
    }
  };

  return (
    <div data-testid="interactive-ordering" role="region" aria-label="Ordering interaction">
      <p style={{ marginBottom: '0.75rem' }}>{instructions}</p>
      <div style={{ marginBottom: '1rem' }}>
        {order.map((itemIdx, posIdx) => (
          <div
            key={itemIdx}
            data-testid={`order-item-${itemIdx}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem',
              marginBottom: '0.25rem',
              background: submitted ? (isCorrect ? '#c8e6c9' : '#ffcdd2') : '#f5f5f5',
              border: `1px solid ${submitted ? (isCorrect ? '#388e3c' : '#c62828') : '#ddd'}`,
              borderRadius: '6px',
            }}
          >
            <span style={{ fontWeight: 600, minWidth: '1.5rem' }}>{posIdx + 1}.</span>
            <span style={{ flex: 1 }}>{items[itemIdx]}</span>
            {!submitted && (
              <>
                <button
                  data-testid={`order-up-${itemIdx}`}
                  onClick={() => moveUp(posIdx)}
                  disabled={posIdx === 0}
                  aria-label={`Move "${items[itemIdx]}" up`}
                  style={{
                    padding: '0.25rem 0.5rem',
                    background: '#e0e0e0',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  ↑
                </button>
                <button
                  data-testid={`order-down-${itemIdx}`}
                  onClick={() => moveDown(posIdx)}
                  disabled={posIdx === order.length - 1}
                  aria-label={`Move "${items[itemIdx]}" down`}
                  style={{
                    padding: '0.25rem 0.5rem',
                    background: '#e0e0e0',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  ↓
                </button>
              </>
            )}
          </div>
        ))}
      </div>
      {!submitted ? (
        <Button data-testid="order-submit" onClick={() => setSubmitted(true)}>
          Check Order
        </Button>
      ) : (
        <div data-testid="order-result">
          <p style={{ color: isCorrect ? '#2e7d32' : '#c62828', fontWeight: 600 }}>
            {isCorrect ? 'Correct order!' : 'Not quite right. Try again!'}
          </p>
          {!isCorrect && (
            <Button data-testid="order-retry" onClick={() => setSubmitted(false)} style={{ marginTop: '0.5rem' }}>
              Try Again
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
