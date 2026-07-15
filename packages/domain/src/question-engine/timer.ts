import type { TimerState, TimingProfileId } from '@pte-app/contracts';

export function calculateRemainingMilliseconds(serverDeadline: string, serverNow: string): number {
  const deadline = new Date(serverDeadline).getTime();
  const now = new Date(serverNow).getTime();
  return Math.max(0, deadline - now);
}

export function isExpired(serverDeadline: string, serverNow: string): boolean {
  return calculateRemainingMilliseconds(serverDeadline, serverNow) <= 0;
}

export function createDeadline(serverNow: string, durationMs: number): string {
  const now = new Date(serverNow).getTime();
  return new Date(now + durationMs).toISOString();
}

export function validateTimerTransition(current: TimerState, next: Partial<TimerState>): boolean {
  if (next.serverDeadline && new Date(next.serverDeadline).getTime() < new Date(current.serverDeadline).getTime()) {
    // Cannot move deadline backwards
    return false;
  }
  return true;
}

export function createTimerSnapshot(
  timingProfileId: TimingProfileId,
  serverDeadline: string,
  serverNow: string,
  warningThresholdMs: number
): TimerState {
  const remaining = calculateRemainingMilliseconds(serverDeadline, serverNow);
  const expired = remaining <= 0;
  const warning = remaining > 0 && remaining <= warningThresholdMs;

  return {
    timingProfileId,
    serverDeadline,
    serverNowAtCreation: serverNow,
    remainingMilliseconds: remaining,
    isExpired: expired,
    warningThresholdReached: warning,
  };
}
