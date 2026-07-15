import type { ProfileRollbackDecision } from '@pte-app/contracts';

export function canRollback(currentVersion: number, originalVersion: number): boolean {
  return currentVersion > originalVersion;
}

export function createRollbackDecision(
  profileId: string,
  candidateVersion: number,
  originalVersion: number,
  reason: string,
  decidedById: string,
): ProfileRollbackDecision {
  return {
    id: crypto.randomUUID(),
    profileId,
    candidateVersion,
    originalVersion,
    reason,
    affectedResultIds: [],
    silentOverwrite: false,
    decidedById,
    decidedAt: new Date().toISOString(),
  };
}
