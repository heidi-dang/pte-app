'use client';

import React from 'react';
import type { QuestionRendererProps } from '../../question-engine/types.js';
import type { WriteEssayQuestion, WriteEssayResponse } from '@pte-app/contracts';
import { WritingEditor } from './writing-editor.js';

export function WriteEssayRenderer({
  question,
  response,
  onChange,
  disabled,
}: QuestionRendererProps<WriteEssayQuestion, WriteEssayResponse>) {
  if (!question) return null;

  return (
    <div role="group" aria-label="Write Essay">
      <p>{question.instructions}</p>
      <h2>{question.prompt}</h2>
      {question.discussionText && (
        <div aria-label="Discussion text" style={{ padding: '16px', border: '1px solid #ccc', borderRadius: '4px' }}>
          {question.discussionText}
        </div>
      )}
      <WritingEditor
        value={response?.text ?? ''}
        onChange={(text) => onChange({ text }, 'incomplete')}
        disabled={disabled}
        maxWords={question.maxWords}
        minWords={question.minWords}
        ariaLabel="Your essay"
      />
    </div>
  );
}
