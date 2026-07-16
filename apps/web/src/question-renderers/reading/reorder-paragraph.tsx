'use client';

import React, { useCallback } from 'react';
import type { QuestionRendererProps } from '../../question-engine/types.js';
import type { ReorderParagraphQuestion, ReorderParagraphResponse } from '@pte-app/contracts';

/**
 * Reading: Re-order Paragraphs renderer.
 *
 * - Move up / Move down buttons (keyboard-operable)
 * - No drag-and-drop required
 * - Screen-reader position announcements
 * - Touch-friendly controls (min 44px)
 * - Stable paragraph IDs
 */
export function ReorderParagraphRenderer({
  question,
  response,
  onChange,
  disabled,
}: QuestionRendererProps<ReorderParagraphQuestion, ReorderParagraphResponse>) {
  const orderedIds = response?.orderedIds ?? [];

  const moveItem = useCallback(
    (fromIndex: number, direction: 'up' | 'down') => {
      const toIndex = direction === 'up' ? fromIndex - 1 : fromIndex + 1;
      if (toIndex < 0 || toIndex >= orderedIds.length) return;
      const newOrder = [...orderedIds];
      const item = newOrder[fromIndex];
      if (item === undefined) return;
      newOrder.splice(fromIndex, 1);
      newOrder.splice(toIndex, 0, item);
      onChange({ orderedIds: newOrder }, 'incomplete');
    },
    [orderedIds, onChange],
  );

  const getItemById = useCallback((id: string) => question?.items?.find((item) => item.id === id), [question?.items]);

  return (
    <div role="group" aria-label="Re-order Paragraphs">
      {question?.instructions && <p className="rop-instructions">{question.instructions}</p>}

      <ol className="rop-list" aria-label="Paragraph order">
        {orderedIds.map((id, index) => {
          const item = getItemById(id);
          if (!item) return null;
          return (
            <li
              key={id}
              id={`rop-item-${id}`}
              className="rop-item"
              aria-label={`Position ${index + 1}: ${item.text}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                minHeight: '44px',
                padding: '8px',
                marginBottom: '4px',
                border: '1px solid #ccc',
                borderRadius: '4px',
              }}
            >
              <span className="rop-item-text" style={{ flex: 1 }}>
                {item.text}
              </span>
              <span className="rop-controls" style={{ display: 'flex', gap: '4px' }}>
                <button
                  type="button"
                  onClick={() => moveItem(index, 'up')}
                  disabled={disabled || index === 0}
                  aria-label={`Move "${item.text}" up`}
                  style={{ minHeight: '44px', minWidth: '44px' }}
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => moveItem(index, 'down')}
                  disabled={disabled || index === orderedIds.length - 1}
                  aria-label={`Move "${item.text}" down`}
                  style={{ minHeight: '44px', minWidth: '44px' }}
                >
                  ↓
                </button>
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
