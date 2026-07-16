'use client';

import React, { useCallback } from 'react';
import type { QuestionRendererProps } from '../../question-engine/types.js';
import type { HighlightCorrectSummaryQuestion, HighlightCorrectSummaryResponse } from '@pte-app/contracts';

/**
 * Listening: Highlight Correct Summary renderer.
 *
 * - Radio-group semantics
 * - Arrow-key operation
 * - Null selection support
 * - Stable option IDs
 * - Touch-friendly controls (min 44px)
 */
export function HighlightCorrectSummaryRenderer({
  question,
  response,
  onChange,
  disabled,
}: QuestionRendererProps<HighlightCorrectSummaryQuestion, HighlightCorrectSummaryResponse>) {
  const selectedKey = response?.selectedKey ?? null;

  const handleSelect = useCallback(
    (key: string) => {
      onChange({ selectedKey: key }, 'complete');
    },
    [onChange],
  );

  return (
    <div role="group" aria-label="Highlight Correct Summary">
      {question?.instructions && <p className="hcs-instructions">{question.instructions}</p>}

      <fieldset>
        <legend className="sr-only">Select the summary that best matches the spoken text</legend>
        {question?.options?.map((opt) => {
          const isSelected = selectedKey === opt.key;
          return (
            <label
              key={opt.key}
              htmlFor={`hcs-opt-${opt.key}`}
              className="hcs-option"
              style={{
                display: 'block',
                minHeight: '44px',
                padding: '8px',
                marginBottom: '8px',
                border: isSelected ? '2px solid #0066cc' : '1px solid #ccc',
                borderRadius: '4px',
                cursor: disabled ? 'not-allowed' : 'pointer',
              }}
            >
              <input
                id={`hcs-opt-${opt.key}`}
                type="radio"
                name="hcs-answer"
                checked={isSelected}
                onChange={() => handleSelect(opt.key)}
                disabled={disabled}
                aria-label={opt.text}
                style={{ minWidth: '44px', minHeight: '44px' }}
              />
              <span className="hcs-option-text" style={{ marginLeft: '8px' }}>
                {opt.text}
              </span>
            </label>
          );
        })}
      </fieldset>
    </div>
  );
}
