# @pte-app/provenance

Audit event tracking and content versioning for the PTE Academic platform.

## Purpose

Provides pure functions for building provenance chains, tracking content version history, and filtering audit events.

## Usage

```typescript
import {
  createProvenanceChain,
  appendToChain,
  createContentVersionHistory,
  addVersion,
  filterEvents,
} from '@pte-app/provenance';
```

## Modules

### chain

Immutable audit event chains with append-only semantics:

- `createProvenanceChain(targetId, targetType)`
- `appendToChain(chain, event)`
- `chainLength(chain)`
- `lastEventInChain(chain)`
- `eventsByActor(chain, actorId)`
- `eventsByType(chain, eventType)`
- `eventsInRange(chain, from, to)`
- `chainHasEventType(chain, eventType)`

### version-history

Content version tracking:

- `createContentVersionHistory(contentId, contentType)`
- `addVersion(history, version)`
- `currentVersion(history)`
- `versionCount(history)`
- `versionExists(history, version)`

### filter

Audit event filtering:

- `matchesFilter(event, filter)`
- `filterEvents(events, filter)`

## Design

- All data structures are immutable
- Pure functions with no side effects
- No infrastructure or I/O dependencies
