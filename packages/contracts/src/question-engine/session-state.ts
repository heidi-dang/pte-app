// packages/contracts/src/question-engine/session-state.ts

import { QuestionSessionId, QuestionId, QuestionVersionId } from './identifiers.js';
import { QuestionSessionMode } from './session-mode.js';

export type SessionState =
  'created' | 'active' | 'paused' | 'submitting' | 'submitted' | 'expired' | 'abandoned' | 'failed';

export interface QuestionSession {
  id: QuestionSessionId;
  mode: QuestionSessionMode;
  state: SessionState;
  questionId?: QuestionId;
  questionVersionId?: QuestionVersionId;
  questionType?: string;
  modeProfileId?: string;
  modeProfileVersion?: number;
  timerDisplayProfileId?: string;
  timingProfileId?: string;
  playbackProfileId?: string;
  scoringProfileId?: string;
  serverDeadline?: string;
  // timestamps as ISO strings
  createdAt: string;
  startedAt?: string;
  pausedAt?: string;
  submittedAt?: string;
  expiredAt?: string;
  abandonedAt?: string;
  updatedAt: string;
}
