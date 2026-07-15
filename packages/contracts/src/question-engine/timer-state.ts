import { TimingProfileId } from './identifiers.js';

export interface TimerState {
  timingProfileId: TimingProfileId;
  serverDeadline: string; // ISO timestamp
  serverNowAtCreation: string;
  remainingMilliseconds: number;
  isExpired: boolean;
  warningThresholdReached: boolean;
}
