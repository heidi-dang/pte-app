# Phase I — Universal Question Engine

## Start Verdict

Phase I has no confirmed technical dependency that prevents architectural preparation.

Phase I structural implementation may proceed on Dev 2's isolated draft branch under the current assignment. It must not be merged, deployed, or treated as an accepted phase until Phase H passes independent audit at 98/100 or higher, merges to main, passes post-merge verification and main-branch CI, and receives final acceptance.

Dev 1 owns runtime integration, deployment, database execution, server and web startup, full testing, and final integration. Dev 2's structural work does not constitute Phase I, J, or K acceptance.

## Scope

Phase I implements the Universal Question Engine — a reusable, session-oriented system for delivering questions, collecting responses, managing playback rights, enforcing idempotent submission, and supporting client-side recovery across all PTE Academic task types. The engine is task-type-agnostic at its core; task-specific rendering and scoring are registered via pluggable handlers.

## Packages

| Package | Purpose | Runtime code |
|---------|---------|-------------|
| `@pte-app/contracts` (`question-engine/`) | Session, response, timer, playback, submission, renderer-manifest, and access-policy contract types | Type definitions only |
| `@pte-app/contracts` (`questions/reading/`) | Reading task-type contracts: MCQ single, MCQ multiple, reorder paragraph, fill blanks, R&W fill blanks | Type definitions only |
| `@pte-app/schemas` (`question-engine/`) | Zod validation schemas for all question-engine contracts | Schema definitions |
| `@pte-app/schemas` (`questions/reading/`) | Zod validation schemas for reading question and response types | Schema definitions |
| `@pte-app/domain` (`question-engine/`) | Session state machine, playback rights, idempotency, timer, event replay, renderer registry, errors | Pure functions |
| `@pte-app/database` | Migration 0004 — question engine persistence tables | Migration SQL |
| `@pte-app/web` (`question-engine/`) | React components: shell, timer, autosave, playback, recovery, renderer host, session client, progress announcer | Client components |

## Design Principles

- **Session-oriented**: Every interaction with a question occurs within a session. Sessions are created, started, paused, submitted, expired, or abandoned — never mutated without a valid state transition.
- **Server-authoritative deadlines**: The server owns the absolute deadline. The client computes skew offset once at mount and derives remaining time locally. The timer never regresses.
- **Idempotent submission**: Every submission carries a client-generated idempotency key. Duplicate keys with matching fingerprints return the cached result; conflicting fingerprints are rejected.
- **Pluggable task-type handlers**: Question types register via a handler registry. Each handler provides a manifest, parser, response factory, state classifier, and submission validator. The engine core never imports task-type-specific code.
- **Consumption-tracked playback**: Audio playback rights are scoped to a session. Each playback consumes a right; consumed rights survive reconnection. Failed playback before consumption does not consume a right.
- **Event-sourced progress**: All session lifecycle events are persisted in sequence order. Events can be replayed to reconstruct session state. Sequence gaps are detected and rejected.
- **Client-side recovery**: A local IndexedDB snapshot stores the last acknowledged revision, pending response, and retry count. On reconnection the client replays unsaved events and resumes from the server-confirmed state.
- **No correct-answer leakage**: Serialisers strip correct answers, transcripts, and scoring profiles from all API responses. Review mode loads correct answers separately after submission verification.

## Tables

| Table | Purpose |
|-------|---------|
| `question_sessions` | Session lifecycle: mode, state, timing/playback/scoring profile IDs, server deadline, state timestamps |
| `question_session_responses` | Versioned response envelopes keyed by session + revision. UPSERT on conflict for autosave |
| `question_session_submissions` | One per session. Stores final response payload, idempotency key, and request fingerprint |
| `question_session_events` | Ordered event log. Unique on (session_id, sequence). Supports event-sourced replay |
| `question_playback_rights` | Audio playback rights per session. Tracks allowed/consumed plays and failure state |
| `question_idempotency_records` | Idempotency keys per session. Enables duplicate detection and conflict rejection |

## Session Modes

| Mode | Pause | Feedback | Server deadline | Autosave | Empty submission | Playback |
|------|-------|----------|----------------|----------|-----------------|----------|
| `learning` | Yes | Yes (no correct answers) | No | Yes | No | Yes |
| `review` | No | Yes (with correct answers) | No | No | No | Yes |
| `timed-practice` | No | Yes (no correct answers) | Yes | Yes | No | No |
| `section-test` | Yes | No | Yes | Yes | No | No |
| `mock` | Yes | Yes (with correct answers) | No | Yes | Yes | Yes |

## Session State Machine

```
created → active → paused → active
                   active → submitting → submitted
                   active → expired
                   active → abandoned
                   active → failed
created → abandoned
created → failed
```

Terminal states: `submitted`, `expired`, `abandoned`, `failed`.

## Event Journal

- `id` — unique event identifier (branded `QuestionEventId`)
- `session_id` — owning session
- `sequence` — monotonically increasing integer, unique per session
- `event_type` — one of 22 defined event types (session, response, timer, playback, submission)
- `event_payload` — JSON-serialised context
- `occurred_at` — ISO-8601 timestamp

Sequence validation rejects gaps: if events arrive out of order or a sequence is missing, the service throws `STALE_RESPONSE_REVISION`. The `replayEvents` function in `@pte-app/domain` sorts events by sequence and applies a reducer to reconstruct any session state from the event log.

Event types span the full session lifecycle:

```
session.created, session.started, session.paused, session.resumed, session.recovered,
response.save-started, response.saved, response.save-failed,
timer.warning, timer.expired,
playback.ready, playback.started, playback.consumed, playback.completed, playback.failed,
submission.started, submission.completed, submission.failed,
session.abandoned
```

## Local Recovery Architecture

The client maintains a local recovery snapshot in IndexedDB (`PteQuestionRecoveryDB`, object store `recoverySnapshots`) keyed by session ID. The snapshot captures:

| Field | Purpose |
|-------|---------|
| `sessionId` | Session identifier for reconnection |
| `lastAcknowledgedRevision` | Highest revision the server confirmed |
| `pendingResponse` | Response payload not yet persisted |
| `pendingResponseState` | State classification of the pending response |
| `pendingEvents` | Events dispatched but not yet acknowledged |
| `retryCount` | Number of recovery attempts |
| `lastAttemptAt` | ISO-8601 timestamp of last recovery attempt |

On page reload or reconnection, the client loads the snapshot, reconciles it against the server state (using the server's latest response revision), and resumes from the confirmed checkpoint. Unsaved responses are re-dispatched. IndexedDB failures are caught and logged silently — the user is prompted to retry manually.

## Autosave Revision Behaviour

Responses are autosaved via `POST /question-sessions/:sessionId/responses`. Each save carries an integer `revision` number. The repository uses UPSERT on `(session_id, revision)`:

- If no response exists for the revision, a new row is inserted.
- If a response already exists for the revision, the payload and state are updated in place.

The service rejects stale revisions: if the latest persisted revision is ≥ the incoming revision, a `STALE_RESPONSE_REVISION` error is returned. This prevents overwriting a newer autosave with an older one after a network delay.

The client autosave controller debounces changes (default 5000ms) and flushes on session exit. Each save is independent — there is no transactional batch across multiple revisions.

## Submission Idempotency

Every submission carries a client-generated `idempotencyKey` (UUID v4) and a `requestFingerprint` (SHA-256 of the serialised request body). The submission flow:

1. Look up existing idempotency record for `(session_id, idempotency_key)`.
2. If found and fingerprint matches → return the cached `SubmissionResult` (duplicate, safe to retry).
3. If found and fingerprint conflicts → throw `IDEMPOTENCY_CONFLICT` (different payload for same key).
4. If not found → proceed with submission, persist the idempotency record in the same transaction.

The idempotency record stores the serialised `SubmissionResult` as `result_payload`. This ensures that even if the client loses the response, re-submitting with the same key returns the original result without re-processing.

## Server-Authoritative Timing

Timed sessions (`timed-practice`, `section-test`) use a server-owned absolute deadline stored in `question_sessions.server_deadline`. The timer flow:

1. **Session creation**: Server computes `deadline = now + durationMs` and stores it.
2. **Client mount**: The `QuestionTimer` component receives `serverDeadline` and `serverNowAtCreation`. It computes `skewOffset = Date.now() - serverNow` once at mount.
3. **Countdown**: Each tick computes `remaining = deadline - (Date.now() - skew)`. The timer never queries the server during countdown.
4. **Expiry**: When `remaining === 0`, the client fires `onExpired` which triggers submission. The server also checks deadline on every response save and rejects writes after expiry.
5. **Reconnection**: On reconnect, the client fetches the session and reads the current `serverDeadline`. If the deadline has passed, the server transitions the session to `expired` and the client reflects this.

The timer component uses `setInterval` at 500ms resolution. Warning threshold is configurable (default 60 seconds before deadline).

## Playback-Right Persistence

Audio playback rights are stored in `question_playback_rights` with a 1:1 relationship to sessions that include a `playbackProfileId`. The right tracks:

| Field | Purpose |
|-------|---------|
| `allowed_plays` | Maximum permitted plays (typically 1 for mock, varies for learning) |
| `consumed_plays` | Number of plays consumed so far |
| `state` | One of: `allowed`, `ready`, `started`, `consumed`, `completed`, `failed-before-consumption`, `failed-after-consumption` |
| `failure_state` | `before-consumption` or `after-consumption` if playback failed |

Key rules:
- A right starts in `allowed` state with `consumedPlays = 0`.
- On playback request, the service checks `canStartPlayback(right)` — returns false if state is `consumed`, `completed`, or `failed-after-consumption`.
- If allowed, the state transitions to `started` and `consumedPlays` increments atomically.
- If playback completes, state becomes `completed`.
- If playback fails before the audio buffer is fully consumed, the right is NOT consumed (state: `failed-before-consumption`). If it fails after consumption, the right IS consumed (state: `failed-after-consumption`).
- Consumed rights survive browser restart and network interruption — they are server-persisted.

## API Routes

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/question-sessions/start` | Yes | Create and activate a new question session |
| GET | `/question-sessions/:sessionId` | Yes | Retrieve session state |
| POST | `/question-sessions/:sessionId/responses` | Yes | Autosave a response revision |
| POST | `/question-sessions/:sessionId/playback` | Yes | Request and consume an audio playback right |
| POST | `/question-sessions/:sessionId/submit` | Yes | Submit the session (idempotent) |
| GET | `/question-sessions/:sessionId/review` | Yes | Retrieve post-submission review data |

All routes require authentication. Owner validation is enforced at the service layer.

## Phase J — Reading Question Types

Phase J provides contracts and Zod validation schemas for all PTE Academic reading task types. These are type definitions only — no renderer components are included.

| Task type | Contract type ID | Response shape |
|-----------|-----------------|----------------|
| Multiple Choice, Single Answer | `reading_single_answer` | `selectedKey: string \| null` |
| Multiple Choice, Multiple Answers | `reading_multiple_answers` | `selectedKeys: string[]` |
| Re-order Paragraphs | `reorder_paragraph` | `orderedIds: string[]` |
| Reading: Fill in the Blanks | `reading_fill_blanks` | `placements: Record<string, string \| null>` |
| Reading & Writing: Fill in the Blanks | `reading_writing_fill_blanks` | `selections: Record<string, string>` |

Correct answers are never embedded in question contracts delivered to the client. Each task type follows a common contract pattern: a `ReadingCommonContract` base provides `type`, `instructions`, and an optional `ReadingPassage` with `id`, `text`, and `wordCount`.

## Phase K — Listening Question Types

Phase K provides contracts and Zod validation schemas for all PTE Academic listening task types. These are type definitions only — no renderer components are included.

| Task type | Contract type ID | Response shape |
|-----------|-----------------|----------------|
| Summarise Spoken Text | `summarise_spoken_text` | `{ summary: string, wordCount: number }` |
| Multiple Choice, Choose Single Answer | `listening_single_answer` | `{ selectedKey: string \| null }` |
| Multiple Choice, Choose Multiple Answers | `listening_multiple_answers` | `{ selectedKeys: string[] }` |
| Fill in the Blanks | `listening_fill_blanks` | `{ placements: Record<string, string \| null> }` |
| Highlight Correct Summary | `highlight_correct_summary` | `{ selectedKey: string \| null }` |
| Select Missing Word | `select_missing_word` | `{ selectedKey: string \| null }` |
| Highlight Incorrect Words | `highlight_incorrect_words` | `{ flaggedWordIndices: number[] }` |
| Write from Dictation | `write_from_dictation` | `{ words: string }` |

Listening tasks share a common pattern: a `ListeningCommonContract` base provides `type`, `instructions`, and an optional `audioProfileId` linking to the playback configuration. Audio playback rights are managed by the question engine's playback subsystem — listening contracts do not duplicate playback state.

Correct answers and transcripts are never embedded in question contracts. Post-submission review loads correct answers separately via the `/review` endpoint.

## What Phase I Does NOT Include

- No task-type renderer implementations (React components for each reading/writing/speaking/listening task type)
- No scoring engine or score calculation
- No AI-assisted speaking or writing evaluation
- No course, lesson, or progress tracking (Phase H)
- No UI routes or page-level integration
- No deployment, infrastructure, or runtime startup
- No integration testing, e2e testing, or browser verification
- No database migration execution (migration SQL is defined but not applied)
- No server startup or web application startup
- No Docker Compose or service orchestration
- No live database connections

## Ownership

### Dev 2 (Structural Implementation)

- Question engine contracts, schemas, domain logic, and error codes
- Database migration SQL (definition only, not execution)
- Reading question type contracts and schemas (Phase J)
- Listening question type contracts and schemas (Phase K)
- Architecture documentation
- Static analysis (format, lint, typecheck)

### Dev 1 (Runtime Integration)

- Database migration execution against real PostgreSQL
- Server startup and Fastify plugin registration
- Web application startup and component integration
- Integration testing against running services
- End-to-end testing with Playwright
- Docker Compose and local environment orchestration
- Deployment pipeline and production configuration
- Full test suite execution and CI verification

Dev 2's structural work does not constitute Phase I, J, or K acceptance. Acceptance requires Phase H to pass independent audit at 98/100 or higher, merge to main, pass post-merge verification and main-branch CI, and receive final acceptance.
