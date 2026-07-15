'use client';

import React, { useCallback, useMemo } from 'react';
import type { QuestionRendererProps } from '../../question-engine/types.js';
import type { ReadingFillBlanksQuestion, ReadingFillBlanksResponse } from '@pte-app/contracts';

/**
 * Reading: Fill in the Blanks renderer (drag/token-based).
 *
 * - Stable option and blank IDs
 * - Keyboard and touch operation
 * - Touch-sized controls (min 44px)
 * - Separate from R&W Fill Blanks
 */
export function ReadingFillBlanksRenderer({
  question,
  response,
  onChange,
  disabled,
}: QuestionRendererProps<ReadingFillBlanksQuestion, ReadingFillBlanksResponse>) {
  const placements = response?.placements ?? {};

  const handlePlace = useCallback(
    (gapIndex: number, tokenId: string | null) => {
      const newPlacements = { ...placements, [String(gapIndex)]: tokenId };
      onChange({ placements: newPlacements }, 'incomplete');
    },
    [placements, onChange],
  );

  const availableTokens = useMemo(() => {
    const placedTokens = new Set(Object.values(placements).filter(Boolean));
    return question?.tokens?.filter((t) => !placedTokens.has(t.id)) ?? [];
  }, [question?.tokens, placements]);

  const passageParts = useMemo(() => {
    if (!question?.passage?.text) return [];
    return question.passage.text.split(/\{GAP:(\d+)\}/);
  }, [question?.passage?.text]);

  return (
    <div role="group" aria-label="Reading Fill in the Blanks">
      {question?.instructions && <p className="rfb-instructions">{question.instructions}</p>}

      <div className="rfb-passage" aria-label="Reading passage with blanks">
        {passageParts.map((part, i) => {
          if (i % 2 === 0) {
            return <span key={`text-${i}`}>{part}</span>;
          }
          const gapIndex = Number(part);
          const currentToken = placements[String(gapIndex)];
          const token = question.tokens?.find((t) => t.id === currentToken);
          return (
            <span
              key={`gap-${gapIndex}`}
              id={`rfb-gap-${gapIndex}`}
              role="button"
              tabIndex={disabled ? -1 : 0}
              aria-label={`Blank ${gapIndex + 1}${token ? `: ${token.text}` : ': empty'}`}
              onClick={() => {
                if (disabled) return;
                handlePlace(gapIndex, null);
              }}
              onKeyDown={(e) => {
                if (disabled) return;
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handlePlace(gapIndex, null);
                }
              }}
              style={{
                display: 'inline-block',
                minHeight: '44px',
                minWidth: '80px',
                border: '1px dashed #999',
                padding: '4px 8px',
                margin: '0 4px',
                cursor: disabled ? 'not-allowed' : 'pointer',
                verticalAlign: 'middle',
              }}
            >
              {token ? token.text : '___'}
            </span>
          );
        })}
      </div>

      <div className="rfb-wordbank" role="group" aria-label="Word bank">
        {availableTokens.map((token) => (
          <button
            key={token.id}
            type="button"
            disabled={disabled}
            aria-label={`Place "${token.text}" in first available blank`}
            onClick={() => {
              if (disabled) return;
              const emptyGap = question.gaps?.find(
                (g) => !placements[String(g.index)] || placements[String(g.index)] === null,
              );
              if (emptyGap) handlePlace(emptyGap.index, token.id);
            }}
            style={{
              minHeight: '44px',
              minWidth: '44px',
              margin: '4px',
              fontSize: '16px',
            }}
          >
            {token.text}
          </button>
        ))}
      </div>
    </div>
  );
}
