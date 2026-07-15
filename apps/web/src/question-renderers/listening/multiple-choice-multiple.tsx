'use client';

import React, { useCallback } from 'react';
import type { QuestionRendererProps } from '../../question-engine/types.js';
import type { ListeningMultipleAnswersQuestion, ListeningMultipleAnswersResponse } from '@pte-app/contracts';

/**
 * Listening: Multiple Choice, Choose Multiple Answers renderer.
 *
 * - Checkbox semantics with stable option IDs
 * - Zero-selection support
 * - Keyboard-operable
 * - Touch-friendly controls (min 44px)
 */
export function ListeningMultipleChoiceMultipleRenderer({
  question,
  response,
  onChange,
  disabled,
}: QuestionRendererProps<ListeningMultipleAnswersQuestion, ListeningMultipleAnswersResponse>) {
  const selectedKeys = response?.selectedKeys ?? [];

  const handleToggle = useCallback(
    (key: string) => {
      const isSelected = selectedKeys.includes(key);
      const newSelected = isSelected ? selectedKeys.filter((k) => k !== key) : [...selectedKeys, key];
      onChange({ selectedKeys: newSelected }, 'complete');
    },
    [selectedKeys, onChange],
  );

  return (
    <div role="group" aria-label="Listening Multiple Choice, Multiple Answers">
      {question?.instructions && <p className="lmc-m-instructions">{question.instructions}</p>}

      {question?.questionStem && <p className="lmc-m-stem">{question.questionStem}</p>}

      <fieldset>
        <legend className="sr-only">Select all correct answers</legend>
        {question?.options?.map((opt) => {
          const isSelected = selectedKeys.includes(opt.key);
          return (
            <label
              key={opt.key}
              htmlFor={`lmc-m-opt-${opt.key}`}
              className="lmc-m-option"
              style={{
                display: 'flex',
                alignItems: 'center',
                minHeight: '44px',
                padding: '8px',
                cursor: disabled ? 'not-allowed' : 'pointer',
              }}
            >
              <input
                id={`lmc-m-opt-${opt.key}`}
                type="checkbox"
                checked={isSelected}
                onChange={() => handleToggle(opt.key)}
                disabled={disabled}
                aria-label={opt.text}
                style={{ minWidth: '44px', minHeight: '44px' }}
              />
              <span className="lmc-m-option-text" style={{ marginLeft: '8px' }}>
                {opt.text}
              </span>
            </label>
          );
        })}
      </fieldset>
    </div>
  );
}
