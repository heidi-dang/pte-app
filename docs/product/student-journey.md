# Student Journey

## Complete Student Journey

Landing page → Registration → Email verification → Profile setup → Target-score selection → Exam-date selection → Device and microphone check → Diagnostic test → Initial estimated score → Personalised plan → Daily lessons → Guided practice → Timed practice → Mistake review → Section tests → Full mock exams → Readiness report → Official-result follow-up

## Stage Details

### Landing Page

- **Student objective**: Understand the platform and its value
- **Interface requirements**: Marketing content, testimonials, feature highlights, pricing, call-to-action for registration
- **Data saved**: Page analytics only
- **Failure states**: Page fails to load, slow content loading
- **Recovery path**: Static fallback content, retry mechanism
- **Next action**: Click Register or Login

### Registration

- **Student objective**: Create an account
- **Interface requirements**: Email, password, name fields; social login options; terms acceptance
- **Data saved**: User account with pending email verification status
- **Failure states**: Email already registered, weak password, network error
- **Recovery path**: Show specific error messages, allow retry, save form state
- **Next action**: Verify email address

### Email Verification

- **Student objective**: Confirm account ownership
- **Interface requirements**: Verification email sent notification, resend button, manual code entry option
- **Data saved**: Verification token with expiry, email verified timestamp
- **Failure states**: Token expired, wrong code, email not received
- **Recovery path**: Resend email, request new token, support contact
- **Next action**: Set up profile

### Profile Setup

- **Student objective**: Complete personal information
- **Interface requirements**: Name, English proficiency, target country, study history
- **Data saved**: Profile fields, completion status
- **Failure states**: Required field missing, network interruption
- **Recovery path**: Autosave completed fields, resume from last saved state
- **Next action**: Select target score

### Target-Score Selection

- **Student objective**: Set PTE score goal
- **Interface requirements**: Overall score slider, section score breakdown, score requirement guidance
- **Data saved**: Target overall and section scores
- **Failure states**: Invalid score range, incomplete selection
- **Recovery path**: Validate ranges client and server side, suggest realistic targets
- **Next action**: Select exam date

### Exam-Date Selection

- **Student objective**: Register intended test date
- **Interface requirements**: Calendar picker, urgency indicators
- **Data saved**: Target exam date
- **Failure states**: Invalid date, date in the past
- **Recovery path**: Validate date range, show error messages
- **Next action**: Complete device check

### Device and Microphone Check

- **Student objective**: Verify speaking readiness
- **Interface requirements**: Microphone permission request, test recording, playback, volume indicator
- **Data saved**: Device check result, microphone type
- **Failure states**: Microphone permission denied, no microphone detected, audio driver issue
- **Recovery path**: Show instructions to enable microphone, detect and report status, provide browser-specific guidance
- **Next action**: Take diagnostic test

### Diagnostic Test

- **Student objective**: Establish baseline score
- **Interface requirements**: Representative tasks from each section, timer, progress indicator, auto-submit
- **Data saved**: All responses, time per task, diagnostic score, completion status
- **Failure states**: Internet interruption, timer expiry, incomplete sections
- **Recovery path**: Save responses as they are submitted, allow resume if interrupted, submit remaining on timeout
- **Next action**: View initial estimated score

### Initial Estimated Score

- **Student objective**: See baseline performance
- **Interface requirements**: Overall score, section breakdown, comparison to target, strength and weakness analysis
- **Data saved**: Estimated score record, score components
- **Failure states**: Scoring service unavailable
- **Recovery path**: Cache scoring profile, queue for reprocessing, show partial results
- **Next action**: Receive personalised plan

### Personalised Plan

- **Student objective**: Understand study path
- **Interface requirements**: Daily study recommendations, task-type focus areas, time allocation, goal tracking
- **Data saved**: Study plan structure, daily targets, completion tracking
- **Failure states**: No diagnostic data, invalid plan calculation
- **Recovery path**: Default plan based on target score, recalculate on new data
- **Next action**: Start daily lessons

### Daily Lessons

- **Student objective**: Learn PTE strategies
- **Interface requirements**: Structured lesson content, video or text instruction, examples, quick practice
- **Data saved**: Lesson progress, completion status, quiz results
- **Failure states**: Content not loading, progress not saved
- **Recovery path**: Cache lesson content, autosave progress
- **Next action**: Complete guided practice

### Guided Practice

- **Student objective**: Practise with hints and feedback
- **Interface requirements**: Question interface, hints, immediate feedback, explanation
- **Data saved**: Response, score, time taken, hint usage
- **Failure states**: Response not saved, feedback not generated
- **Recovery path**: Autosave response, queue feedback generation
- **Next action**: Try timed practice

### Timed Practice

- **Student objective**: Simulate test conditions
- **Interface requirements**: Question interface with timer controlled by the selected timing profile, section-appropriate time limits
- **Data saved**: Response, score, time taken, completion status
- **Failure states**: Timer desync, response lost
- **Recovery path**: Server-authoritative timer, periodic autosave, response recovery on reconnect. Timer behaviour is controlled by the selected timing profile; may pause when configuration permits.
- **Next action**: Review mistakes

### Mistake Review

- **Student objective**: Learn from errors
- **Interface requirements**: Filterable mistake list, correct answer display, explanation, related practice
- **Data saved**: Mistake tags, review status, confidence rating
- **Failure states**: Mistake data not available
- **Recovery path**: Fallback to cached results
- **Next action**: Complete section test

### Section Tests

- **Student objective**: Test specific skill areas
- **Interface requirements**: Full section simulation, all task types for that section, timed, mock-like experience
- **Data saved**: All responses, section score, time data
- **Failure states**: Same as mock exam failure states
- **Recovery path**: Same as mock exam recovery paths
- **Next action**: Take full mock exam

### Full Mock Exams

- **Student objective**: Complete test simulation
- **Interface requirements**: Full-length PTE Academic simulation, all sections, real timing, breaks, auto-submit
- **Data saved**: Complete response set, timer data, scores, question versions
- **Failure states**: Internet interruption, browser crash, accidental close, scoring provider timeout, scoring provider unavailable
- **Recovery path**: Autosave every response immediately, persist session state server-side, resume from last completed task. Server stores an absolute deadline that continues during browser closure or network interruption. On reconnection, obtain current server time and recalculate remaining time. Completed responses remain submitted. Consumed audio playback rights remain consumed. A recording already captured remains available for resumable upload. The same answer cannot be submitted twice. Unanswered mock responses are permitted; the platform does not fabricate answers. Reprocess scoring when provider available.
- **Next action**: View readiness report

### Readiness Report

- **Student objective**: Assess test readiness
- **Interface requirements**: Predicted score range, comparison to target, section-level readiness, improvement trajectory, study recommendations
- **Data saved**: Report data, predicted scores
- **Failure states**: Scoring data incomplete
- **Recovery path**: Show available data with warnings
- **Next action**: Book official PTE test

### Official-Result Follow-Up

- **Student objective**: Track real outcome
- **Interface requirements**: Score entry form, comparison to platform estimates, satisfaction survey
- **Data saved**: Official scores, comparison data, calibration data
- **Failure states**: Invalid score entry
- **Recovery path**: Validate input ranges
- **Next action**: Continue studying or celebrate

## Edge Cases

### No Exam Date

Student can still use the platform for practice and learning. Study plan adapts to exclude exam-date-specific recommendations. Progress tracking remains fully functional.

### Exam Date Within Seven Days

Platform adjusts study plan to prioritise review and mock tests over new content. Highlights urgency in dashboard. Recommends completion of at least one full mock exam before test day.

### Microphone Permission Denied

Speaking tasks are disabled. Platform displays guidance on enabling microphone permissions. Dashboard indicates speaking section is unavailable. Student can complete non-speaking tasks.

### Internet Interruption

Autosave stores current response locally. On reconnection, saved response syncs to server. In learning mode, timer may pause when configuration permits. In mock mode, server-authoritative deadline continues; remaining time is recalculated on reconnection.

### Incomplete Diagnostic

Platform generates a partial baseline using completed sections. Missing sections are marked for later assessment. Study plan adjusts to compensate for missing data.

### Student Misses a Week

Platform adjusts study plan to catch up. Recommends focused review of missed material. Sends re-engagement notification. Dashboard shows gap in activity.

### Subscription Expires

Active sessions complete gracefully. Access to paid content is restricted on next navigation. Saved progress and results remain accessible. Available free tier functionality continues. Reactivation restores full access.

### Mock Is Interrupted

Session state persists on server. Server stores an absolute deadline that continues during interruption. On reconnection, remaining time is recalculated from server time. Completed responses remain submitted. Consumed audio playback rights remain consumed. If speaking responses were partially uploaded, upload resumes without requiring a new response. The same answer cannot be submitted twice.

### Scoring Provider Is Temporarily Unavailable

Responses are queued for scoring. Student is notified that scores are pending. Results appear when scoring completes. Estimated wait time is displayed where possible. No responses are lost.
