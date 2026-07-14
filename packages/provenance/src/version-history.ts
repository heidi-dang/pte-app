import type { Version, AuditEventId } from '@pte-app/types';
import { deepFreeze } from './freeze.js';
import type { ProvenanceTarget } from './chain.js';

export type ContentVersionTarget = ProvenanceTarget;

export interface ContentVersion {
  readonly version: Version;
  readonly auditEventId: AuditEventId;
  readonly publishedAt: string;
  readonly retiredAt: string | null;
}

export interface ContentVersionHistory {
  readonly target: ContentVersionTarget;
  readonly versions: ReadonlyArray<ContentVersion>;
}

export function createContentVersionHistory(target: ContentVersionTarget): ContentVersionHistory {
  return deepFreeze({
    target,
    versions: [],
  });
}

export function addVersion(history: ContentVersionHistory, version: ContentVersion): ContentVersionHistory {
  return deepFreeze({
    ...history,
    versions: [...history.versions, version],
  });
}

export function currentVersion(history: ContentVersionHistory): ContentVersion | null {
  if (history.versions.length === 0) return null;
  const last = history.versions[history.versions.length - 1];
  return last !== undefined ? last : null;
}

export function versionCount(history: ContentVersionHistory): number {
  return history.versions.length;
}

export function versionExists(history: ContentVersionHistory, version: Version): boolean {
  return history.versions.some((v) => v.version === version);
}
