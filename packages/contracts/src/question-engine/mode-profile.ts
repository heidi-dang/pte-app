// packages/contracts/src/question-engine/mode-profile.ts

import type { QuestionSessionMode, SessionModeCapabilities } from './session-mode.js';
import type { TimingProfileId, PlaybackProfileId, ScoringProfileId } from './identifiers.js';

export interface QuestionSessionModeProfile {
  id: string;
  version: number;
  mode: QuestionSessionMode;
  capabilities: SessionModeCapabilities;
  timingProfileId?: TimingProfileId;
  playbackProfileId?: PlaybackProfileId;
  scoringProfileId?: ScoringProfileId;
}
