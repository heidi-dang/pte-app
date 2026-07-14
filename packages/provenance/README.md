# @pte-app/provenance

Audit event tracking and content versioning for the PTE Academic platform.

## Purpose

Provides pure functions for building provenance chains, tracking content version history, and filtering audit events. Contains zero infrastructure, persistence, or network code.

## Dependency Rule

Depends only on `@pte-app/contracts` and `@pte-app/types`. Must NOT depend on `@pte-app/domain` or `@pte-app/schemas`.

## Modules

### chain

Immutable audit event chains with append-only semantics:

- `createProvenanceChain(target: ProvenanceTarget)`
- `appendToChain(chain, event)`
- `chainLength(chain)`
- `lastEventInChain(chain)`
- `eventsByActor(chain, actorId)`
- `eventsByType(chain, eventType)`
- `eventsInRange(chain, from, to)`
- `chainHasEventType(chain, eventType)`

`ProvenanceTarget` is a discriminated union of branded entity IDs:

```typescript
{
  type: 'question';
  id: QuestionId;
}
{
  type: 'course';
  id: CourseId;
}
{
  type: 'lesson';
  id: LessonId;
}
{
  type: 'exam';
  id: ExamId;
}
{
  type: 'session';
  id: SessionId;
}
{
  type: 'attempt';
  id: AttemptId;
}
{
  type: 'result';
  id: ResultId;
}
{
  type: 'media';
  id: MediaId;
}
{
  type: 'upload';
  id: UploadId;
}
{
  type: 'user';
  id: UserId;
}
{
  type: 'configuration';
  id: ConfigurationId;
}
```

### version-history

Content version tracking:

- `createContentVersionHistory(target: ContentVersionTarget)`
- `addVersion(history, version)`
- `currentVersion(history)`
- `versionCount(history)`
- `versionExists(history, version)`

### filter

Audit event filtering:

- `matchesFilter(event, filter)`
- `filterEvents(events, filter)`

## Design

- All data structures are runtime immutable (deeply frozen)
- Pure functions with no side effects
- No infrastructure or I/O dependencies
- Branded target identifiers prevent entity ID interchange
