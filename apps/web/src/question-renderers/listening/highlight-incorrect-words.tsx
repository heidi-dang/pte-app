'use client';

import React, { useCallback, useMemo } from 'react';
import type { QuestionRendererProps } from '../../question-engine/types.js';
import type { HighlightIncorrectWordsQuestion, HighlightIncorrectWordsResponse } from '@pte-app/contracts';

/**
 * Listening: Highlight Incorrect Words renderer.
 *
 * - Mouse, touch, and keyboard operation
 * - Stable token IDs (word index)
 * - Non-colour-only selected state (border + icon)
 * - Screen-reader selected state
 * - Touch-friendly controls (min 44px)
 */
export function HighlightIncorrectWordsRenderer({
  question,
  response,
  onChange,
  disabled,
}: QuestionRendererProps<HighlightIncorrectWordsQuestion, HighlightIncorrectWordsResponse>) {
  const flaggedIndices = response?.flaggedWordIndices ?? [];

  const words = useMemo(() => {
    return question?.transcript?.split(/\s+/) ?? [];
  }, [question?.transcript]);

  const handleToggle = useCallback(
    (index: number) => {
      const isFlagged = flaggedIndices.includes(index);
      const newFlagged = isFlagged ? flaggedIndices.filter((i) => i !== index) : [...flaggedIndices, index];
      onChange({ flaggedWordIndices: newFlagged }, 'complete');
    },
    [flaggedIndices, onChange],
  );

  return (
    <div role="group" aria-label="Highlight Incorrect Words">
      {question?.instructions && <p className="hiw-instructions">{question.instructions}</p>}

      <div
        className="hiw-transcript"
        role="group"
        aria-label="Transcript — click or tap words that are different from the audio"
      >
        {words.map((word, index) => {
          const isFlagged = flaggedIndices.includes(index);
          return (
            <span
              key={`word-${index}`}
              id={`hiw-word-${index}`}
              role="button"
              tabIndex={disabled ? -1 : 0}
              aria-pressed={isFlagged}
              aria-label={`Word ${index + 1}: "${word}"${isFlagged ? ' — marked as incorrect' : ''}`}
              onClick={() => {
                if (disabled) return;
                handleToggle(index);
              }}
              onKeyDown={(e) => {
                if (disabled) return;
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleToggle(index);
                }
              }}
              style={{
                display: 'inline-block',
                minHeight: '44px',
                minWidth: '44px',
                padding: '4px 8px',
                margin: '2px',
                border: isFlagged ? '2px solid #d32f2f' : '1px solid transparent',
                borderRadius: '4px',
                backgroundColor: isFlagged ? '#ffebee' : 'transparent',
                cursor: disabled ? 'not-allowed' : 'pointer',
                verticalAlign: 'middle',
              }}
            >
              {word}
              {isFlagged && <span className="sr-only"> (marked)</span>}
            </span>
          );
        })}
      </div>

      <div className="hiw-count" aria-live="polite">
        Marked: {flaggedIndices.length}
        {question?.incorrectWordCount !== undefined && ` / ${question.incorrectWordCount} incorrect`}
      </div>
    </div>
  );
}
