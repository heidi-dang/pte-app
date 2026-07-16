'use client';

import React, { useCallback } from 'react';
import type { QuestionRendererProps } from '../../question-engine/types.js';
import type { WriteFromDictationQuestion, WriteFromDictationResponse } from '@pte-app/contracts';

/**
 * Listening: Write from Dictation renderer.
 *
 * - Text input for exact transcription
 * - Touch-friendly controls (min 44px)
 * - Keyboard-operable
 */
export function WriteFromDictationRenderer({
  question,
  response,
  onChange,
  disabled,
}: QuestionRendererProps<WriteFromDictationQuestion, WriteFromDictationResponse>) {
  const handleTextChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const text = e.target.value;
      onChange({ words: text }, text.trim().length > 0 ? 'complete' : 'empty');
    },
    [onChange],
  );

  return (
    <div role="group" aria-label="Write from Dictation">
      {question?.instructions && <p className="wfd-instructions">{question.instructions}</p>}

      <label htmlFor="wfd-words" className="sr-only">
        Type exactly what you hear
      </label>
      <textarea
        id="wfd-words"
        value={response?.words ?? ''}
        onChange={handleTextChange}
        disabled={disabled}
        placeholder="Type exactly what you hear..."
        rows={4}
        aria-label="Dictation text"
        style={{ width: '100%', minHeight: '100px', fontSize: '16px' }}
      />

      {question?.wordCount !== undefined && (
        <div className="wfd-word-count" aria-live="polite">
          Expected words: {question.wordCount}
        </div>
      )}
    </div>
  );
}
