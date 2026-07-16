'use client';

import React, { useCallback } from 'react';
import type { QuestionRendererProps } from '../../question-engine/types.js';
import type { ReadingMultipleChoiceMultipleQuestion, ReadingMultipleChoiceMultipleResponse } from '@pte-app/contracts';

/**
 * Reading: Multiple Choice, Multiple Answers renderer.
 *
 * - Checkbox semantics with stable option IDs
 * - Zero-selection support
 * - Keyboard-operable
 * - Touch-friendly controls (min 44px)
 */
export function ReadingMultipleChoiceMultipleRenderer({
  question,
  response,
  onChange,
  disabled,
}: QuestionRendererProps<ReadingMultipleChoiceMultipleQuestion, ReadingMultipleChoiceMultipleResponse>) {
  const selectedKeys = response?.selectedKeys ?? [];

  const handleToggle = useCallback(
    (key: string) => {
      const isSelected = selectedKeys.includes(key);
      const newSelected = isSelected ? selectedKeys.filter((k) => k !== key) : [...selectedKeys, key];
      onChange({ selectedKeys: newSelected }, newSelected.length > 0 ? 'complete' : 'empty');
    },
    [selectedKeys, onChange],
  );

  return (
    <div role="group" aria-label="Multiple Choice, Multiple Answers">
      {question?.instructions && <p className="mcm-instructions">{question.instructions}</p>}

      {question?.questionStem && <p className="mcm-stem">{question.questionStem}</p>}

      <fieldset>
        <legend className="sr-only">Select all correct answers</legend>
        {question?.options?.map((opt) => {
          const isSelected = selectedKeys.includes(opt.key);
          return (
            <label
              key={opt.key}
              htmlFor={`mcm-opt-${opt.key}`}
              className="mcm-option"
              style={{
                display: 'flex',
                alignItems: 'center',
                minHeight: '44px',
                padding: '8px',
                cursor: disabled ? 'not-allowed' : 'pointer',
              }}
            >
              <input
                id={`mcm-opt-${opt.key}`}
                type="checkbox"
                checked={isSelected}
                onChange={() => handleToggle(opt.key)}
                disabled={disabled}
                aria-label={opt.text}
                style={{ minWidth: '44px', minHeight: '44px' }}
              />
              <span className="mcm-option-text" style={{ marginLeft: '8px' }}>
                {opt.text}
              </span>
            </label>
          );
        })}
      </fieldset>
    </div>
  );
}
