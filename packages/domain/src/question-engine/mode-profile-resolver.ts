import type { QuestionSessionModeProfile, SessionModeCapabilities } from '@pte-app/contracts';
import type { QuestionSessionMode } from '@pte-app/contracts';
import { createEngineError } from './errors.js';

export type ModeProfileStore = {
  find(mode: QuestionSessionMode, version: number): QuestionSessionModeProfile | undefined;
  list(mode: QuestionSessionMode): QuestionSessionModeProfile[];
};

export function resolveModeProfile(
  store: ModeProfileStore,
  mode: QuestionSessionMode,
  version?: number,
): QuestionSessionModeProfile {
  if (version !== undefined) {
    if (!Number.isInteger(version) || version < 1) {
      throw createEngineError('INCOMPATIBLE_MODE_PROFILE', `Invalid mode profile version: ${version}`);
    }
    const profile = store.find(mode, version);
    if (!profile) {
      throw createEngineError('MISSING_MODE_PROFILE', `No mode profile found for mode '${mode}' version ${version}`);
    }
    if (profile.mode !== mode) {
      throw createEngineError(
        'INCOMPATIBLE_MODE_PROFILE',
        `Mode profile '${profile.id}' mode '${profile.mode}' does not match requested mode '${mode}'`,
      );
    }
    return profile;
  }

  const profiles = store.list(mode);
  if (profiles.length === 0) {
    throw createEngineError('MISSING_MODE_PROFILE', `No mode profiles found for mode '${mode}'`);
  }

  const sorted = [...profiles].sort((a, b) => b.version - a.version);
  const latest = sorted[0];
  if (!latest) {
    throw createEngineError('MISSING_MODE_PROFILE', `No mode profiles found for mode '${mode}'`);
  }

  if (latest.mode !== mode) {
    throw createEngineError(
      'INCOMPATIBLE_MODE_PROFILE',
      `Mode profile '${latest.id}' mode '${latest.mode}' does not match requested mode '${mode}'`,
    );
  }

  return latest;
}

export function getCapabilities(profile: QuestionSessionModeProfile): SessionModeCapabilities {
  return profile.capabilities;
}

export function validateNoDuplicateVersions(profiles: QuestionSessionModeProfile[]): void {
  const seen = new Map<string, QuestionSessionModeProfile>();
  for (const profile of profiles) {
    const key = `${profile.mode}:${profile.version}`;
    const existing = seen.get(key);
    if (existing) {
      throw createEngineError(
        'INCOMPATIBLE_MODE_PROFILE',
        `Duplicate mode profile version ${profile.version} for mode '${profile.mode}': '${existing.id}' and '${profile.id}'`,
      );
    }
    seen.set(key, profile);
  }
}
