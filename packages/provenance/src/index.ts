export {
  ProvenanceEntry,
  ProvenanceChain,
  createProvenanceChain,
  appendToChain,
  chainLength,
  lastEventInChain,
  eventsByActor,
  eventsByType,
  eventsInRange,
  chainHasEventType,
} from './chain.js';

export {
  ContentVersion,
  ContentVersionHistory,
  createContentVersionHistory,
  addVersion,
  currentVersion,
  versionCount,
  versionExists,
} from './version-history.js';

export { AuditEventFilter, matchesFilter, filterEvents } from './filter.js';
