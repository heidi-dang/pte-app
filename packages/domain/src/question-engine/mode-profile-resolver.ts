import type { QuestionSessionModeProfile, SessionModeCapabilities } from '@pte-app/contracts';
import type { QuestionSessionMode } from '@pte-app/contracts';
import { createEngineError } from './errors.js';

export type ModeProfileStore = {
  find(mode: QuestionSessionMode, version?: number): QuestionSessionModeProfile | undefined;
  list(mode: QuestionSessionMode): QuestionSessionModeProfile[];
};

export function resolveModeProfile(
  store: ModeProfileStore,
  mode: QuestionSessionMode,
  version?: number,
): QuestionSessionModeProfile {
  const profile = version !== undefined ? store.find(mode, version) : store.list(mode).at(-1);
  if (!profile) {
    throw createEngineError(
      'MISSING_MODE_PROFILE',
      `No mode profile found for mode '${mode}'${version !== undefined ? ` version ${version}` : ''}`,
    );
  }
  return profile;
}

export function getCapabilities(profile: QuestionSessionModeProfile): SessionModeCapabilities {
  return profile.capabilities;
}
