import { TimingProfileId } from './identifiers';

export interface TimerState {
  timingProfileId: TimingProfileId;
  serverDeadline: string; // ISO timestamp
  serverNowAtCreation: string;
  remainingMilliseconds: number;
  isExpired: boolean;
  warningThresholdReached: boolean;
}
