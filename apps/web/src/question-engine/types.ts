import type React from 'react';
import type { ResponseState, QuestionRendererManifest } from '@pte-app/contracts';

export interface QuestionRendererProps<TQuestion = any, TResponse = any> {
  question: TQuestion;
  response: TResponse;
  onChange: (response: TResponse, state: ResponseState) => void;
  disabled?: boolean;
  sessionMode?: string;
  isReadOnly?: boolean;
}

export interface QuestionReviewProps<TQuestion = any, TResponse = any> {
  question: TQuestion;
  response: TResponse;
  correctAnswers: any;
}

export interface WebQuestionRenderer<TQuestion = any, TResponse = any> {
  type: string;
  manifest: QuestionRendererManifest;
  Renderer: React.ComponentType<QuestionRendererProps<TQuestion, TResponse>>;
  ReviewRenderer: React.ComponentType<QuestionReviewProps<TQuestion, TResponse>>;
}
