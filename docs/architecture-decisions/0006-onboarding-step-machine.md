# ADR 0006: Onboarding Step Machine

## Status

Approved

## Context

New student accounts must complete a guided onboarding flow before accessing practice content.
The steps are: `profile → targets → microphone → complete`.

## Decision

Represent onboarding state as a single **opaque string field** (`onboardingStep` on `UserProfile`)
alongside a boolean flag (`onboardingComplete`).

### Rationale

- **Simple state**: The onboarding flow is strictly linear with no branching for MVP.
  A single string field is sufficient; a full state-machine library would be overkill.
- **Tolerant of future extension**: New steps can be added without schema migration by
  inserting a new valid value into the allowed set in the API layer.
- **UI-driven ordering**: The front-end drives which step to advance to; the API only
  validates membership in the allowed set and persists the value.

## Step Definitions

| Step         | Meaning                                               |
| ------------ | ----------------------------------------------------- |
| `profile`    | User has completed their name/country/timezone fields |
| `targets`    | User has set their target band scores and exam date   |
| `microphone` | User has passed the microphone check                  |
| `complete`   | All steps done; full product access granted           |

## Implications

- `onboardingComplete = true` is set automatically when `step = "complete"` is received.
- The API does **not** enforce sequential step ordering; any step can be sent in any order.
  This allows the UI to pick up from wherever the student left off, and lets admin tools
  mark steps programmatically.
