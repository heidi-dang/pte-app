import type { TimerDisplayProfile } from '@pte-app/contracts';

/**
 * Development/test fixture for timer display profiles.
 * This is NOT used by production code. Production requires an explicit
 * profile ID resolved via resolveTimerDisplayProfile().
 */
export const DEV_TIMER_DISPLAY_PROFILE_FIXTURE: TimerDisplayProfile = {
  refreshIntervalMs: 1000,
  warningThresholdsMs: [60_000, 30_000, 10_000],
};

/**
 * Test-only fixture with minimal thresholds for fast test execution.
 */
export const TEST_TIMER_DISPLAY_PROFILE: TimerDisplayProfile = {
  refreshIntervalMs: 500,
  warningThresholdsMs: [5_000],
};
