export type { ProvenanceTarget, ProvenanceEntry, ProvenanceChain } from './chain.js';
export {
  createProvenanceChain,
  appendToChain,
  chainLength,
  lastEventInChain,
  eventsByActor,
  eventsByType,
  eventsInRange,
  chainHasEventType,
} from './chain.js';

export type { ContentVersion, ContentVersionTarget, ContentVersionHistory } from './version-history.js';
export {
  createContentVersionHistory,
  addVersion,
  currentVersion,
  versionCount,
  versionExists,
} from './version-history.js';

export type { AuditEventFilter } from './filter.js';
export { matchesFilter, filterEvents } from './filter.js';

export { LocalTestSimilarityProvider } from './similarity.js';
export type { SimilarityProvider, SimilarityResult } from './similarity.js';
