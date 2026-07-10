# ADR-0004: Recoverable Assessment State

## Status

Accepted

## Context

Students complete practice and mock exam sessions that may last 30 minutes to 3 hours. During these sessions, internet interruptions, browser crashes, accidental closes and system failures can occur.

Without state recovery, students would lose progress and have to restart, damaging trust and causing frustration.

## Decision

Practice and mock-test sessions use persisted server-side state with local recovery support.

## Alternatives Considered

- **Client-only state**: All session state in the browser. Rejected because data is lost on browser close or clear.
- **Server-only state without local support**: State on server only. Rejected because temporary network loss can prevent state updates.
- **Periodic full save**: Save entire session state at intervals. Rejected because it is resource-intensive and may lose data between saves.
- **Event-sourced state with local cache (chosen)**: Each student action is persisted as an event. Local cache provides immediate recovery. Server replays events on reconnect.

## Key Mechanisms

### Autosave

- Student responses are saved within 5 seconds of each change.
- Writing responses autosave continuously as the student types.
- Speaking recordings are streamed and saved incrementally where possible.

### Event Persistence

- Every student action (start task, submit response, navigate section) is persisted as an event.
- Events are stored in the database with session ID, timestamp and sequence number.
- Events are idempotent and can be safely replayed.

### Server-Authoritative Timers

- Timer state is managed on the server, not the client.
- The client displays a countdown synced with the server.
- On reconnection, the client receives the authoritative remaining time.
- This prevents timer manipulation and ensures accurate timing across interruptions.

### Media Playback Tracking

- Audio playback progress is tracked on the server.
- On interruption and resume, playback continues from the last tracked position (within task rules).

### Recording-Upload State

- Recording uploads include chunk tracking.
- On reconnection, only missing chunks are uploaded.
- Partial recordings are preserved even if upload is interrupted.

### Duplicate-Submission Prevention

- Each submission includes a unique idempotency key.
- The server rejects duplicate submissions with the same key.
- Students can safely retry submission without risk of double scoring.

### Resume Behaviour

- On reconnection after interruption, the student returns to the exact task they were working on.
- Completed tasks remain completed with their original responses.
- The timer reflects the remaining time at the point of interruption.
- Session expiry policies are clearly communicated before the session starts.
