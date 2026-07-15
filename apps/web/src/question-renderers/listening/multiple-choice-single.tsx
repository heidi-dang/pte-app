'use client';

import React, { useCallback } from 'react';
import type { QuestionRendererProps } from '../../question-engine/types.js';
import type { ListeningSingleAnswerQuestion, ListeningSingleAnswerResponse } from '@pte-app/contracts';

/**
 * Listening: Multiple Choice, Choose Single Answer renderer.
 *
 * - Radio-group semantics
 * - Arrow-key operation
 * - Null selection support
 * - Stable option IDs
 * - Touch-friendly controls (min 44px)
 */
export function ListeningMultipleChoiceSingleRenderer({
  question,
  response,
  onChange,
  disabled,
}: QuestionRendererProps<ListeningSingleAnswerQuestion, ListeningSingleAnswerResponse>) {
  const selectedKey = response?.selectedKey ?? null;

  const handleSelect = useCallback(
    (key: string) => {
      onChange({ selectedKey: key }, 'complete');
    },
    [onChange],
  );

  return (
    <div role="group" aria-label="Listening Multiple Choice, Single Answer">
      {question?.instructions && <p className="lmc-s-instructions">{question.instructions}</p>}

      {question?.questionStem && <p className="lmc-s-stem">{question.questionStem}</p>}

      <fieldset>
        <legend className="sr-only">Select one answer</legend>
        {question?.options?.map((opt) => {
          const isSelected = selectedKey === opt.key;
          return (
            <label
              key={opt.key}
              htmlFor={`lmc-s-opt-${opt.key}`}
              className="lmc-s-option"
              style={{
                display: 'flex',
                alignItems: 'center',
                minHeight: '44px',
                padding: '8px',
                cursor: disabled ? 'not-allowed' : 'pointer',
              }}
            >
              <input
                id={`lmc-s-opt-${opt.key}`}
                type="radio"
                name="lmc-s-answer"
                checked={isSelected}
                onChange={() => handleSelect(opt.key)}
                disabled={disabled}
                aria-label={opt.text}
                style={{ minWidth: '44px', minHeight: '44px' }}
              />
              <span className="lmc-s-option-text" style={{ marginLeft: '8px' }}>
                {opt.text}
              </span>
            </label>
          );
        })}
      </fieldset>
    </div>
  );
}
