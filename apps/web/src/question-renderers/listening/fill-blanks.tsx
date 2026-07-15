'use client';

import React, { useCallback } from 'react';
import type { QuestionRendererProps } from '../../question-engine/types.js';
import type { ListeningFillBlanksQuestion, ListeningFillBlanksResponse } from '@pte-app/contracts';

/**
 * Listening: Fill in the Blanks renderer.
 *
 * - Transcript with gaps
 * - Text input per gap
 * - Touch-friendly controls (min 44px)
 * - Keyboard-operable
 */
export function ListeningFillBlanksRenderer({
  question,
  response,
  onChange,
  disabled,
}: QuestionRendererProps<ListeningFillBlanksQuestion, ListeningFillBlanksResponse>) {
  const placements = response?.placements ?? {};

  const handleChange = useCallback(
    (gapIndex: number, value: string) => {
      const newPlacements = { ...placements, [String(gapIndex)]: value || null };
      onChange({ placements: newPlacements }, 'incomplete');
    },
    [placements, onChange],
  );

  const transcriptParts = question?.transcript?.split(/\{GAP:(\d+)\}/) ?? [];

  return (
    <div role="group" aria-label="Listening Fill in the Blanks">
      {question?.instructions && <p className="lfb-instructions">{question.instructions}</p>}

      <div className="lfb-transcript" aria-label="Transcript with blanks">
        {transcriptParts.map((part, i) => {
          if (i % 2 === 0) {
            return <span key={`text-${i}`}>{part}</span>;
          }
          const gapIndex = Number(part);
          return (
            <input
              key={`gap-${gapIndex}`}
              id={`lfb-gap-${gapIndex}`}
              type="text"
              value={placements[String(gapIndex)] ?? ''}
              onChange={(e) => handleChange(gapIndex, e.target.value)}
              disabled={disabled}
              aria-label={`Blank ${gapIndex + 1}`}
              style={{
                minWidth: '80px',
                minHeight: '44px',
                fontSize: '16px',
                padding: '4px 8px',
                margin: '0 4px',
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
