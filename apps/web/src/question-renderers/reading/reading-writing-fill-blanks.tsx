'use client';

import React, { useCallback, useMemo } from 'react';
import type { QuestionRendererProps } from '../../question-engine/types.js';
import type { ReadingWritingFillBlanksQuestion, ReadingWritingFillBlanksResponse } from '@pte-app/contracts';

/**
 * Reading & Writing: Fill in the Blanks renderer.
 *
 * - Stable blank IDs derived from gap index
 * - Keyboard-selectable dropdown per gap
 * - Touch-sized controls
 * - Empty/incomplete state via onChange callback
 */
export function ReadingWritingFillBlanksRenderer({
  question,
  response,
  onChange,
  disabled,
}: QuestionRendererProps<ReadingWritingFillBlanksQuestion, ReadingWritingFillBlanksResponse>) {
  const selections = response?.selections ?? {};

  const handleChange = useCallback(
    (gapIndex: number, optionKey: string) => {
      const newSelections = { ...selections, [String(gapIndex)]: optionKey };
      onChange({ selections: newSelections }, 'incomplete');
    },
    [selections, onChange],
  );

  const passageParts = useMemo(() => {
    if (!question?.passage?.text) return [];
    return question.passage.text.split(/\{GAP:(\d+)\}/);
  }, [question?.passage?.text]);

  return (
    <div role="group" aria-label="Reading and Writing Fill in the Blanks">
      {question?.instructions && <p className="rwb-instructions">{question.instructions}</p>}

      <div className="rwb-passage" aria-label="Reading passage with blanks">
        {passageParts.map((part, i) => {
          if (i % 2 === 0) {
            return <span key={`text-${i}`}>{part}</span>;
          }
          const gapIndex = Number(part);
          const gap = question.gaps?.find((g) => g.index === gapIndex);
          if (!gap) return null;
          return (
            <select
              key={`gap-${gapIndex}`}
              id={`rwb-gap-${gapIndex}`}
              value={selections[String(gapIndex)] ?? ''}
              onChange={(e) => handleChange(gapIndex, e.target.value)}
              disabled={disabled}
              aria-label={`Blank ${gapIndex + 1}`}
              style={{ minHeight: '44px', minWidth: '44px', fontSize: '16px' }}
            >
              <option value="">Select...</option>
              {gap.options.map((opt) => (
                <option key={opt.key} value={opt.key}>
                  {opt.text}
                </option>
              ))}
            </select>
          );
        })}
      </div>
    </div>
  );
}
