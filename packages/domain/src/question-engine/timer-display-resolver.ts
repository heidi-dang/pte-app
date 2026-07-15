import type { TimerDisplayProfile } from '@pte-app/contracts';
import { createEngineError } from './errors.js';

export type TimerDisplayProfileStore = {
  get(id: string): TimerDisplayProfile | undefined;
};

const DEFAULT_TIMER_DISPLAY_PROFILE: TimerDisplayProfile = {
  refreshIntervalMs: 1000,
  warningThresholdsMs: [60_000, 30_000, 10_000],
};

export function resolveTimerDisplayProfile(
  store: TimerDisplayProfileStore,
  profileId: string | undefined,
): TimerDisplayProfile {
  if (!profileId) return DEFAULT_TIMER_DISPLAY_PROFILE;
  const profile = store.get(profileId);
  if (!profile) {
    throw createEngineError('MISSING_TIMER_DISPLAY_PROFILE', `No timer display profile found for id '${profileId}'`);
  }
  return profile;
}
