import type { TimerDisplayProfile } from '@pte-app/contracts';
import { createEngineError } from './errors.js';

export type TimerDisplayProfileStore = {
  get(id: string): TimerDisplayProfile | undefined;
};

/**
 * Production resolver requires an explicit profile ID.
 * Undefined or unknown IDs throw MISSING_TIMER_DISPLAY_PROFILE.
 * No implicit timing defaults exist in production code.
 */
export function resolveTimerDisplayProfile(
  store: TimerDisplayProfileStore,
  profileId: string | undefined,
): TimerDisplayProfile {
  if (!profileId) {
    throw createEngineError('MISSING_TIMER_DISPLAY_PROFILE', 'Timer display profile ID is required');
  }
  const profile = store.get(profileId);
  if (!profile) {
    throw createEngineError('MISSING_TIMER_DISPLAY_PROFILE', `No timer display profile found for id '${profileId}'`);
  }
  return profile;
}
