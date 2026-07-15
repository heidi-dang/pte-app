'use client';

import React, { useMemo, type ComponentType } from 'react';
import type { QuestionRendererProps, WebQuestionRenderer } from './types.js';
import type { WebRendererRegistry } from './renderer-registry.js';

export interface RendererHostProps<TQuestion = unknown, TResponse = unknown> {
  registry: WebRendererRegistry;
  questionType: string;
  question: TQuestion;
  response: TResponse;
  sessionMode: string;
  isReadOnly?: boolean;
  onResponseChange?: (response: TResponse) => void;
  /** Aria label for the host container */
  ariaLabel?: string;
}

/**
 * RendererHost resolves the correct renderer component from the registry
 * and mounts it with typed props. If no renderer is found it renders a
 * graceful unsupported-type message rather than crashing.
 */
export function RendererHost<TQuestion = unknown, TResponse = unknown>({
  registry,
  questionType,
  question,
  response,
  sessionMode,
  isReadOnly = false,
  onResponseChange,
  ariaLabel,
}: RendererHostProps<TQuestion, TResponse>) {
  const Renderer = useMemo(
    () => registry.resolve(questionType) as ComponentType<QuestionRendererProps<TQuestion, TResponse>> | null,
    [registry, questionType],
  );

  if (!Renderer) {
    return (
      <div role="alert" aria-label="Unsupported question type">
        <p>
          Question type <code>{questionType}</code> is not supported by this client version. Please refresh or contact
          support.
        </p>
      </div>
    );
  }

  return (
    <div role="region" aria-label={ariaLabel ?? `${questionType} renderer`}>
      <Renderer
        question={question}
        response={response}
        sessionMode={sessionMode}
        isReadOnly={isReadOnly}
        onResponseChange={onResponseChange}
      />
    </div>
  );
}
