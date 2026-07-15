// packages/contracts/src/question-engine/session-state.ts

import { QuestionSessionId } from './identifiers';
import { QuestionSessionMode } from './session-mode';

export type SessionState =
  | 'created'
  | 'active'
  | 'paused'
  | 'submitting'
  | 'submitted'
  | 'expired'
  | 'abandoned'
  | 'failed';

export interface QuestionSession {
  id: QuestionSessionId;
  mode: QuestionSessionMode;
  state: SessionState;
  // timestamps as ISO strings
  createdAt: string;
  startedAt?: string;
  pausedAt?: string;
  submittedAt?: string;
  expiredAt?: string;
  abandonedAt?: string;
  updatedAt: string;
}
