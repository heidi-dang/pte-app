import type { PlaybackRight } from '@pte-app/contracts';

export function canStartPlayback(right: PlaybackRight): boolean {
  if (right.state === 'consumed' || right.state === 'completed' || right.state === 'failed-after-consumption') {
    return false;
  }
  return right.consumedPlays < right.allowedPlays;
}

export function markPlaybackStarted(right: PlaybackRight, now: string): PlaybackRight {
  return {
    ...right,
    state: 'started',
    startedAt: now,
  };
}

export function markPlaybackConsumed(right: PlaybackRight, now: string): PlaybackRight {
  const consumedPlays = right.consumedPlays + 1;
  const state = consumedPlays >= right.allowedPlays ? 'consumed' : right.state;
  return {
    ...right,
    consumedPlays,
    state,
    consumedAt: now,
  };
}

export function markPlaybackCompleted(right: PlaybackRight, now: string): PlaybackRight {
  return {
    ...right,
    state: 'completed',
    completedAt: now,
  };
}

export function recordPlaybackFailure(
  right: PlaybackRight,
  after: 'before-consumption' | 'after-consumption'
): PlaybackRight {
  const state = after === 'before-consumption' ? 'failed-before-consumption' : 'failed-after-consumption';
  return {
    ...right,
    state,
    failureState: after,
  };
}

export function calculateRemainingPlays(right: PlaybackRight): number {
  return Math.max(0, right.allowedPlays - right.consumedPlays);
}
