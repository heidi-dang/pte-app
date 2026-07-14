import type { TimingProfile } from '../configuration.js';

export const SPEAKING_TIMING: TimingProfile = Object.freeze({
  preparationSeconds: 30,
  responseSeconds: 40,
  reviewSeconds: 10,
});

export const WRITING_TIMING: TimingProfile = Object.freeze({
  preparationSeconds: 2,
  responseSeconds: 240,
  reviewSeconds: 0,
});

export const READING_TIMING: TimingProfile = Object.freeze({
  preparationSeconds: 0,
  responseSeconds: 180,
  reviewSeconds: 0,
});

export const LISTENING_TIMING: TimingProfile = Object.freeze({
  preparationSeconds: 5,
  responseSeconds: 120,
  reviewSeconds: 10,
});

export const TIMING_PROFILES: Record<string, TimingProfile> = Object.freeze({
  speaking: SPEAKING_TIMING,
  writing: WRITING_TIMING,
  reading: READING_TIMING,
  listening: LISTENING_TIMING,
});

export function getTimingProfile(section: string): TimingProfile | undefined {
  return TIMING_PROFILES[section];
}
