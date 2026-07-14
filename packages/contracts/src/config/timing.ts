import type { ConfigurationId, Version, ConfigurationStatus, ISO8601Date, JsonObject } from '@pte-app/types';
import type { VersionedTimingProfile } from '../configuration.js';

const TRAINING_SOURCE = 'estimated-training-configuration';

export const TRAINING_TIMING_PROFILES: ReadonlyArray<VersionedTimingProfile> = Object.freeze([
  Object.freeze({
    id: 'cfg-timing-speaking-read-aloud' as ConfigurationId,
    version: '1.0.0' as Version,
    status: 'active' as ConfigurationStatus,
    profileId: 'training-speaking-read-aloud',
    taskType: 'read-aloud',
    section: 'speaking',
    preparationSeconds: 30,
    responseSeconds: 40,
    reviewSeconds: 10,
    source: TRAINING_SOURCE,
    effectiveFrom: '2026-01-01' as ISO8601Date,
    effectiveUntil: null,
    supersededBy: null,
    metadata: Object.freeze({ note: 'Estimated training values for read-aloud task timing' } as JsonObject),
  } as const),
  Object.freeze({
    id: 'cfg-timing-writing-essay' as ConfigurationId,
    version: '1.0.0' as Version,
    status: 'active' as ConfigurationStatus,
    profileId: 'training-writing-essay',
    taskType: 'write-essay',
    section: 'writing',
    preparationSeconds: 2,
    responseSeconds: 240,
    reviewSeconds: 0,
    source: TRAINING_SOURCE,
    effectiveFrom: '2026-01-01' as ISO8601Date,
    effectiveUntil: null,
    supersededBy: null,
    metadata: Object.freeze({ note: 'Estimated training values for write-essay task timing' } as JsonObject),
  } as const),
  Object.freeze({
    id: 'cfg-timing-reading-reorder' as ConfigurationId,
    version: '1.0.0' as Version,
    status: 'active' as ConfigurationStatus,
    profileId: 'training-reading-reorder',
    taskType: 'reorder-paragraphs',
    section: 'reading',
    preparationSeconds: 0,
    responseSeconds: 180,
    reviewSeconds: 0,
    source: TRAINING_SOURCE,
    effectiveFrom: '2026-01-01' as ISO8601Date,
    effectiveUntil: null,
    supersededBy: null,
    metadata: Object.freeze({ note: 'Estimated training values for reorder-paragraphs task timing' } as JsonObject),
  } as const),
  Object.freeze({
    id: 'cfg-timing-listening-fill' as ConfigurationId,
    version: '1.0.0' as Version,
    status: 'active' as ConfigurationStatus,
    profileId: 'training-listening-fill',
    taskType: 'fill-in-the-blanks',
    section: 'listening',
    preparationSeconds: 5,
    responseSeconds: 120,
    reviewSeconds: 10,
    source: TRAINING_SOURCE,
    effectiveFrom: '2026-01-01' as ISO8601Date,
    effectiveUntil: null,
    supersededBy: null,
    metadata: Object.freeze({ note: 'Estimated training values for fill-in-the-blanks task timing' } as JsonObject),
  } as const),
]);

const timingIndex = new Map<string, VersionedTimingProfile>(
  TRAINING_TIMING_PROFILES.map((p) => [`${p.section}:${p.taskType}`, p] as const),
);

export function getTimingProfile(section: string, taskType: string): VersionedTimingProfile | undefined {
  return timingIndex.get(`${section}:${taskType}`);
}

export function getTimingProfileById(profileId: ConfigurationId): VersionedTimingProfile | undefined {
  return TRAINING_TIMING_PROFILES.find((p) => p.id === profileId);
}

export function getActiveTimingProfiles(): ReadonlyArray<VersionedTimingProfile> {
  return TRAINING_TIMING_PROFILES.filter((p) => p.status === 'active');
}

export function requireTimingProfile(section: string, taskType: string): VersionedTimingProfile {
  const profile = getTimingProfile(section, taskType);
  if (profile === undefined) {
    throw new Error(`No timing profile found for section="${section}" taskType="${taskType}"`);
  }
  return profile;
}
