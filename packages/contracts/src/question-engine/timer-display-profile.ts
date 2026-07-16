// packages/contracts/src/question-engine/timer-display-profile.ts

export interface TimerDisplayProfile {
  /** Interval in ms at which the timer display refreshes. */
  refreshIntervalMs: number;
  /** Sorted ascending list of thresholds (in ms before deadline) at which warnings fire. */
  warningThresholdsMs: number[];
}
