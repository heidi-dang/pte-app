import type React from 'react';
import type { ResponseState, QuestionRendererManifest, RecordingProfile } from '@pte-app/contracts';

export interface QuestionRendererProps<TQuestion = never, TResponse = never> {
  question: TQuestion;
  response: TResponse;
  onChange: (key: TResponse, state: ResponseState) => void;
  disabled?: boolean;
  sessionMode?: string;
  isReadOnly?: boolean;
  recordingProfile?: RecordingProfile;
  attemptId?: string;
  recordingProfileId?: string;
}

export interface QuestionReviewProps<TQuestion = never, TResponse = never> {
  question: TQuestion;
  response: TResponse;
  correctAnswers: Record<string, unknown>;
}

export interface WebQuestionRenderer<TQuestion = never, TResponse = never> {
  type: string;
  manifest: QuestionRendererManifest;
  Renderer: React.ComponentType<QuestionRendererProps<TQuestion, TResponse>>;
  ReviewRenderer: React.ComponentType<QuestionReviewProps<TQuestion, TResponse>>;
}
