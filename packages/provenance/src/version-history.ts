import type { Version } from '@pte-app/types';

export interface ContentVersion {
  readonly version: Version;
  readonly auditEventId: string;
  readonly publishedAt: string;
  readonly retiredAt: string | null;
}

export interface ContentVersionHistory {
  readonly contentId: string;
  readonly contentType: string;
  readonly versions: ReadonlyArray<ContentVersion>;
}

export function createContentVersionHistory(contentId: string, contentType: string): ContentVersionHistory {
  return {
    contentId,
    contentType,
    versions: [],
  };
}

export function addVersion(history: ContentVersionHistory, version: ContentVersion): ContentVersionHistory {
  return {
    ...history,
    versions: [...history.versions, version],
  };
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
