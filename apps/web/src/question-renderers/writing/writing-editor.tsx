'use client';

import React from 'react';
import { WordCount } from './word-count.js';

function countWordsLocal(text: string): number {
  if (!text || text.trim().length === 0) return 0;
  return text
    .replace(/[\r\n]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

interface WritingEditorProps {
  value: string;
  onChange: (text: string) => void;
  disabled?: boolean;
  maxWords: number;
  minWords: number;
  ariaLabel: string;
}

export function WritingEditor({ value, onChange, disabled, maxWords, minWords, ariaLabel }: WritingEditorProps) {
  const wordCount = countWordsLocal(value);

  return (
    <div>
      <textarea
        aria-label={ariaLabel}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        style={{ width: '100%', minHeight: '200px', padding: '8px' }}
      />
      <WordCount current={wordCount} min={minWords} max={maxWords} />
    </div>
  );
}
