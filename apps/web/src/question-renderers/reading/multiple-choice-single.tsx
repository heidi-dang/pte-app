'use client';

import React, { useCallback } from 'react';
import type { QuestionRendererProps } from '../../question-engine/types.js';
import type { ReadingMultipleChoiceSingleQuestion, ReadingMultipleChoiceSingleResponse } from '@pte-app/contracts';

/**
 * Reading: Multiple Choice, Single Answer renderer.
 *
 * - Radio-group semantics
 * - Arrow-key operation
 * - Null selection support
 * - Stable option IDs
 * - Touch-friendly controls (min 44px)
 */
export function ReadingMultipleChoiceSingleRenderer({
  question,
  response,
  onChange,
  disabled,
}: QuestionRendererProps<ReadingMultipleChoiceSingleQuestion, ReadingMultipleChoiceSingleResponse>) {
  const selectedKey = response?.selectedKey ?? null;

  const handleSelect = useCallback(
    (key: string) => {
      onChange({ selectedKey: key }, 'complete');
    },
    [onChange],
  );

  return (
    <div role="group" aria-label="Multiple Choice, Single Answer">
      {question?.instructions && <p className="mcs-instructions">{question.instructions}</p>}

      {question?.questionStem && <p className="mcs-stem">{question.questionStem}</p>}

      <fieldset>
        <legend className="sr-only">Select one answer</legend>
        {question?.options?.map((opt) => {
          const isSelected = selectedKey === opt.key;
          return (
            <label
              key={opt.key}
              htmlFor={`mcs-opt-${opt.key}`}
              className="mcs-option"
              style={{
                display: 'flex',
                alignItems: 'center',
                minHeight: '44px',
                padding: '8px',
                cursor: disabled ? 'not-allowed' : 'pointer',
              }}
            >
              <input
                id={`mcs-opt-${opt.key}`}
                type="radio"
                name="mcs-answer"
                checked={isSelected}
                onChange={() => handleSelect(opt.key)}
                disabled={disabled}
                aria-label={opt.text}
                style={{ minWidth: '44px', minHeight: '44px' }}
              />
              <span className="mcs-option-text" style={{ marginLeft: '8px' }}>
                {opt.text}
              </span>
            </label>
          );
        })}
      </fieldset>
    </div>
  );
}
