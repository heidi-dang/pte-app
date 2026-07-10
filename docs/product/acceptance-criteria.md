# Acceptance Criteria

## Registration

1. A user can register with a valid email address and password of at least 8 characters.
2. A user cannot register with an email address that is already registered.
3. A verification email is sent within a configurable period (default: 30 seconds) of successful registration.
4. The registration form remains filled on navigation back after a validation error.
5. Registration fails gracefully with specific field-level error messages.

## Authentication

1. A user can log in with registered email and password.
2. Login fails after `AUTH_MAX_FAILED_ATTEMPTS` (default: 5) consecutive incorrect attempts with an `AUTH_LOCKOUT_SECONDS` (default: 60) lockout.
3. A session token expires after `SESSION_IDLE_TIMEOUT_SECONDS` (default: 86400 / 24 hours) of inactivity.
4. A user can remain logged in across browser tabs.
5. Logout invalidates the session token immediately.

## Onboarding

1. Onboarding can be completed in a single session or resumed from the last incomplete step.
2. Target score selection enforces PTE Academic valid ranges (10-90 overall).
3. Microphone check records a test sample and confirms audio capture within a configurable period.
4. Device check results are stored and available on the student profile.
5. Skipping onboarding still grants access to the platform dashboard.

## Courses

1. A course is displayed with title, description, lesson count and estimated duration.
2. Lessons within a course are ordered and show completion status.
3. Course progress is calculated as the percentage of completed lessons.
4. A completed lesson remains marked complete after logout and re-login.
5. Course content loads within a configurable SLA (default: 3 seconds) on a standard broadband connection.

## Practice

1. A practice session can be started for any available question type.
2. Each question is displayed with its instruction, prompt and input area.
3. Responses are autosaved at `AUTOSAVE_INTERVAL_MS` (default: 5000ms) of each change.
4. A submitted response must remain available after page refresh, API restart and browser restart.
5. A practice session can be abandoned and progress for unanswered questions is not saved.

## Speaking

1. The recording interface begins capture after preparation completes and within 1 second of user action.
2. Recording continues for the configured response duration or until the user stops.
3. The browser keeps the recording locally until server storage is confirmed.
4. Interrupted uploads resume or retry without requiring a new response.
5. A recorded response replays within a configurable SLA (default: 3 seconds) of user request.
6. Recording fails with a clear error message when microphone permission is denied.
7. Upload SLA: 1MB audio file uploaded within 10 seconds on a standard broadband connection.

## Writing

1. The writing editor autosaves at `AUTOSAVE_INTERVAL_MS` (default: 5000ms) when content has changed.
2. Word count is displayed and updated in real time.
3. A submitted writing response must remain available after page refresh, API restart and browser restart.
4. The editor restores the last autosaved version on page reload after an interruption.
5. A writing response of 0 words cannot be submitted.

## Reading

1. Reading passages render with proper formatting and scroll within the viewport.
2. Fill-in-the-blanks accept single-click word selection from a provided list.
3. Reorder-paragraph items accept drag-and-drop reordering with touch support.
4. Multiple-choice questions accept single or multiple selections as required.
5. Section-level timer displays remaining time and auto-submits when time expires.

## Listening

1. Audio playback starts within a configurable SLA (default: 2 seconds) of user action.
2. In practice mode, audio controls include play, pause and volume adjustment when permitted by configuration.
3. In practice mode, audio can be replayed according to task-specific playback limit configuration.
4. In mock mode, playback limit is 1 per task as defined by the official task specification.
5. In mock mode, no transcript is visible before submission.
6. Section-level timer displays remaining time and auto-submits when time expires.

## Diagnostic

1. The diagnostic test contains representative tasks from all four PTE sections.
2. The diagnostic produces an estimated overall score and section breakdown.
3. An incomplete diagnostic generates partial results for completed sections.
4. The diagnostic score is available within `SCORING_TARGET_SECONDS` (default: 60 seconds) of submission.
5. The diagnostic can be retaken after a configurable period (default: 30 days).

## Study Plan

1. A study plan is generated immediately after a diagnostic is scored.
2. The study plan includes daily task allocations and estimated time commitment.
3. The study plan adjusts when the target score or exam date changes.
4. Completed tasks are marked and progress is reflected in the plan.
5. A study plan can be regenerated if the student has new diagnostic data.

## Mock Exams

1. A mock exam includes all PTE Academic sections in the correct order.
2. Mock exam timing matches official PTE Academic section timing.
3. The server stores an absolute deadline. The deadline continues during browser closure or network interruption.
4. On reconnection, the client obtains the current server time and recalculates remaining time. The timer does not return to the amount remaining at interruption.
5. Completed responses remain submitted after interruption and reconnection.
6. Consumed audio playback rights remain consumed after reconnection.
7. A recording already captured remains available for resumable upload.
8. The same answer cannot be submitted twice (idempotency enforcement).
9. Submitted mock responses are scored and results are available within `SCORING_TARGET_SECONDS` (default: 5 minutes).
10. A partially completed mock saves all completed section responses.
11. In mock mode, unanswered responses are permitted without penalty; the platform does not fabricate answers.

## Scoring

1. Objective questions are scored immediately upon submission.
2. Speaking and writing estimated scores are available within `SCORING_TARGET_SECONDS` (default: 5 minutes) of submission.
3. Each score result includes the scoring profile version and confidence range.
4. Historical scores remain unchanged when scoring profiles are updated.
5. Scoring provider unavailability queues responses for processing without data loss.

## Payments

1. A user can purchase a subscription with a valid payment method.
2. Payment confirmation is displayed within a configurable SLA after successful processing.
3. A subscription activates immediately upon payment confirmation.
4. A cancelled subscription remains active until the end of the billing period.
5. Payment webhooks are processed idempotently to prevent double charges.

## Teacher Review

1. A teacher can view assigned student responses within a configurable SLA.
2. A teacher can enter a score and written or audio feedback for each submission.
3. Teacher scores and feedback are visible to the student within a configurable SLA of submission.
4. A teacher cannot alter a score after it has been reviewed by a second teacher.
5. Teacher review assignments prevent duplicate review of the same response.

## Content Publication

1. A content draft is validated for completeness before submission for review.
2. A content reviewer can approve or reject submitted content with a reason.
3. Published content is immutable and revision creates a new version.
4. Retired content is not available for new practice sessions but remains in historical reports.
5. Content below 9/10 review score cannot be published.

## Recovery

1. A page refresh during practice preserves the current question and response.
2. A browser restart during a mock exam preserves all completed responses. The server deadline continues and the remaining time is recalculated on reconnection.
3. A network interruption during recording saves the partial recording locally and resumes or retries upload on reconnection without requiring a new response.
4. A server restart during scoring queues the response for processing when the service resumes.
5. A session expiry during practice saves completed responses and returns the user to the practice selection page.

## Mobile Experience

1. All student routes render correctly on a 375px wide viewport.
2. Touch targets are at least 44x44px for all interactive elements.
3. Horizontal scrolling is not required on any student route.
4. Speaking recording works on mobile Safari and Chrome.
5. Form inputs display the correct virtual keyboard type.

## Performance

1. Initial page load completes within a configurable SLA (default: 3 seconds) on a standard broadband connection.
2. API responses for question delivery complete within 1 second for 95 percent of requests.
3. Score report generation completes within 30 seconds.
4. The application supports 1000 concurrent students during mock exam periods.
5. Search results appear within 2 seconds of user input.

## Deployment

1. The application deploys without manual intervention from the main branch.
2. A failed deployment rolls back to the previous stable version automatically.
3. Database migrations run automatically during deployment.
4. Deployment completes within 15 minutes.
5. Post-deployment health checks pass within 5 minutes.
