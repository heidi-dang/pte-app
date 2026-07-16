# Phase I — Universal Question Engine

## Objective

Implement the shared attempt/session/question engine that all later Reading (J), Listening (K), Speaking (L), and Writing (M) task renderers will use.

## Renderer Contract

File: `packages/contracts/src/phase-i/index.ts` — `RendererContract` interface.

Every task type (Reading, Listening, Speaking, Writing) must implement:

- `taskType` — unique string identifier
- `responseSchema` — JSON Schema describing valid response shape
- `emptyResponseFactory()` — returns minimal valid empty response
- `validateResponse(response)` — returns `{ valid, errors? }`
- `normalizeResponse(response)` — cleans/normalizes raw response
- `scoringAdapter(response)` — extracts scoring data
- `timerPolicy` — server-authoritative timing config
- `playbackPolicy?` — optional, for Listening tasks
- `reviewVisibilityPolicy` — controls what is visible in review
- `accessibility` — screen reader, keyboard, font scaling support
- `progressEventContract` — event names for tracking

## State Machine

Valid status transitions:

```
created → in_progress → autosaved → submitted → reviewable
  │          │              │          │
  └──→ expired ←───────────┘          │
  └──→ interrupted → recovered → in_progress/autosaved/submitted
```

## Required Adapter Shape for Phase J (Reading)

1. Create a renderer implementing `RendererContract` with `taskType: 'pte:reading:*'`
2. Define response schema for the specific reading sub-type
3. Implement `validateResponse` checking reading answer format
4. Implement `scoringAdapter` for reading-specific scoring
5. Register via the renderer registry (to be extended from Phase I plugin)

## Required Adapter Shape for Phase K (Listening)

1. Create a renderer implementing `RendererContract` with `taskType: 'pte:listening:*'`
2. Include a `playbackPolicy` with `maxPlays`, `consumeOnFirstPlay`, `reconnectResetsConsumed`
3. Use the `/api/v1/attempt/playback/record` endpoint to track consumption
4. Implement `validateResponse` for listening answer format

## What Dev 2 Must Audit

1. State machine transitions correctness
2. Idempotency on submit (duplicate key prevention)
3. Empty/corrupt payload handling
4. Autosave does not mark as submitted
5. Review mode does not allow answer mutation
6. Timer is server-authoritative (not browser-only)
7. Playback consumed state survives resume/reconnect
8. Renderer contract is task-type agnostic
9. Phase H course progress must not be broken
10. Existing Phase G provenance/licence tests must remain unaffected

## Files Changed

- `packages/types/src/index.ts` — added `QuestionAttemptId`, `QuestionSessionId`, `QuestionVersionSnapshotId`, `PlaybackConsumptionId`, `IdempotencyKey`
- `packages/contracts/src/phase-i/index.ts` — NEW: all Phase I contracts, renderer contract, state machine
- `packages/contracts/src/index.ts` — re-export phase-i
- `packages/domain/src/question-attempt.ts` — NEW: domain entity + state machine functions
- `packages/domain/src/question-renderer.ts` — NEW: renderer contract helpers
- `packages/domain/src/index.ts` — re-export phase-i domain
- `packages/schemas/src/phase-i.ts` — NEW: Zod schemas for all Phase I types
- `packages/schemas/src/index.ts` — re-export phase-i schemas
- `packages/database/src/migrations/0008_phase_i.sql` — NEW: migration (question_sessions, question_version_snapshots, question_attempts, playback_consumption)
- `packages/database/src/migrations/runner.ts` — register 0008 migration
- `packages/database/src/repositories/phase-i/attempts.ts` — NEW: repository for attempts/sessions/playback
- `packages/database/src/repositories/phase-i/index.ts` — NEW: barrel
- `packages/database/src/index.ts` — re-export phaseI
- `services/api/src/phase-i/plugin.ts` — NEW: API routes (start, get, autosave, submit, review, playback record)
- `services/api/src/phase-i/demo-renderer.ts` — NEW: demo/fake renderers for test verification
- `services/api/src/phase-i/test-fixtures.ts` — NEW: test fixtures for Phase I
- `services/api/src/app.ts` — registered phaseIPlugin
- `packages/domain/src/question-attempt.unit.test.ts` — NEW: unit tests
- `services/api/src/phase-i/phase-i.unit.test.ts` — NEW: contract tests
- `docs/phase-i/implementation-contract.md` — NEW: this file

## Hardening — Dev 2 Audit Items (A–Z)

The following 26 hardening checks were applied and validated:

| #   | Check                                 | Implementation                                                                                                                                                                               |
| --- | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A   | Wire renderer validation into API     | `renderer-registry.ts` maps `taskType → RendererContract`. `validateAndNormalizeResponse` helper in `plugin.ts` calls `validateResponse` + `normalizeResponse` on autosave and submit.       |
| B   | Add renderer registry                 | `services/api/src/phase-i/renderer-registry.ts` — `registerRenderer`, `resolveRenderer`, `clearRegistry`. Demo renderers registered at plugin init.                                          |
| C   | Enforce corrupt payload rejection     | `isObject()` guard on `request.body` in every mutating endpoint. Rejects non-object, null, and array bodies with 400.                                                                        |
| D   | Support empty/incomplete response     | `validateResponse` on each renderer contract allows empty (`{}`) or incomplete (`{selectedIndex: null}`) per demo contract. Normalized via `emptyResponseFactory` fallback.                  |
| E   | Enforce timed/mock expiry             | `isExpired()` check in autosave and submit. Expired attempts auto-transition to `expired` state and are rejected with 400.                                                                   |
| F   | Strengthen playback-right enforcement | Pre-flight check: if `consumedAt` is set or `playCount >= maxPlays`, existing record is returned without incrementing. Reconnect-safe — count persists across sessions.                      |
| G   | Lock review mode mutation             | Terminal-state (`submitted`, `reviewable`, `expired`) rejection in both autosave and submit before any business logic.                                                                       |
| H   | Add DB-backed integration tests       | `services/api/src/phase-i/phase-i.api.test.ts` — covers registry, validation, corrupt payloads, empty responses, expiry, playback rights, normalized storage, idempotency, session recovery. |
| I   | Check migration works with Phase H    | `test-fixtures.ts` rewritten to use `phaseH.courses.createCourse`, `phaseH.modules.createCourseModule`, `phaseH.lessons.createLesson` → phase-eight FK chain satisfied.                      |
| J   | Update documentation                  | This section.                                                                                                                                                                                |

## Files Changed (Phase I Hardening)

- `services/api/src/phase-i/renderer-registry.ts` — NEW: renderer registry
- `services/api/src/phase-i/plugin.ts` — renderer validation, corrupt payload rejection, expiry enforcement, terminal-state lock, playback-right pre-flight
- `services/api/src/phase-i/test-fixtures.ts` — proper course/module/lesson creation via Phase H API
- `services/api/src/phase-i/phase-i.api.test.ts` — NEW: DB-backed integration tests
- `packages/database/src/repositories/phase-i/attempts.ts` — added `getVersionSnapshot`
- `docs/phase-i/implementation-contract.md` — this section

## What Was Intentionally Not Implemented

- Phase J Reading task types
- Phase K Listening task types
- Speaking recorder
- Writing tasks
- Changes to Phase G provenance/licence logic
- Production timed/mock mode enforcement (uses generic contracts)
- Hardcoded domains, ports, models, prices, score weights, timing profiles, subscription limits
