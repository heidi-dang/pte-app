import { QuestionSessionId } from './identifiers.js';

export interface QuestionAccessInput {
  userId: string;
  sessionId?: QuestionSessionId;
  questionType: string;
  sessionMode: string;
}

export interface QuestionAccessDecision {
  allowed: boolean;
  reason?: string;
}

export interface QuestionAccessPolicy {
  canStartSession(input: QuestionAccessInput): Promise<QuestionAccessDecision>;
}
