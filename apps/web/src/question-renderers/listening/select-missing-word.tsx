'use client';

import React, { useCallback } from 'react';
import type { QuestionRendererProps } from '../../question-engine/types.js';
import type { SelectMissingWordQuestion, SelectMissingWordResponse } from '@pte-app/contracts';

/**
 * Listening: Select Missing Word renderer.
 *
 * - Radio-group semantics
 * - Arrow-key operation
 * - Null selection support
 * - Stable option IDs
 * - Touch-friendly controls (min 44px)
 */
export function SelectMissingWordRenderer({
  question,
  response,
  onChange,
  disabled,
}: QuestionRendererProps<SelectMissingWordQuestion, SelectMissingWordResponse>) {
  const selectedKey = response?.selectedKey ?? null;

  const handleSelect = useCallback(
    (key: string) => {
      onChange({ selectedKey: key }, 'complete');
    },
    [onChange],
  );

  return (
    <div role="group" aria-label="Select Missing Word">
      {question?.instructions && <p className="smw-instructions">{question.instructions}</p>}

      {question?.transcript && (
        <div className="smw-transcript" aria-label="Transcript">
          {question.transcript}
        </div>
      )}

      <fieldset>
        <legend className="sr-only">Select the missing word</legend>
        {question?.options?.map((opt) => {
          const isSelected = selectedKey === opt.key;
          return (
            <label
              key={opt.key}
              htmlFor={`smw-opt-${opt.key}`}
              className="smw-option"
              style={{
                display: 'flex',
                alignItems: 'center',
                minHeight: '44px',
                padding: '8px',
                cursor: disabled ? 'not-allowed' : 'pointer',
              }}
            >
              <input
                id={`smw-opt-${opt.key}`}
                type="radio"
                name="smw-answer"
                checked={isSelected}
                onChange={() => handleSelect(opt.key)}
                disabled={disabled}
                aria-label={opt.text}
                style={{ minWidth: '44px', minHeight: '44px' }}
              />
              <span className="smw-option-text" style={{ marginLeft: '8px' }}>
                {opt.text}
              </span>
            </label>
          );
        })}
      </fieldset>
    </div>
  );
}
