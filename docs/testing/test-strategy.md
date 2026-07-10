# Test Strategy

## Unit Tests

Unit tests must be implemented for the following areas:

- **Scoring rules**: Deterministic scoring logic for objective question types; partial credit calculations; penalty calculations
- **Timer behaviour**: Countdown accuracy; auto-submit on expiry; pause and resume logic
- **Text normalisation**: Whitespace handling; case insensitivity; punctuation stripping; Unicode normalisation
- **Study-plan calculations**: Daily allocation generation; progress calculation; plan adjustment on target change
- **Entitlements**: Feature access based on subscription plan; plan limits enforcement; upgrade and downgrade logic
- **Content validation**: Metadata completeness; format validation; answer format checking; duplicate detection

## Integration Tests

Integration tests must verify that services interact correctly:

- **API and database**: CRUD operations; transaction behaviour; migration execution; query performance
- **API and Redis**: Session storage; rate limiting; cache invalidation; job queue operations
- **Worker and Redis**: Job dispatch; job processing; retry logic; failure handling
- **API and scoring service**: Response submission; score retrieval; timeout handling; error propagation
- **Object storage**: File upload; file retrieval; file deletion; access control; content-type handling
- **Payment webhook processing**: Webhook receipt; idempotency handling; subscription activation; failure notification
- **Content import**: Bulk content ingestion; format validation; media association; error reporting

## End-to-End Tests

Full user journey tests must cover:

- **Register**: Create account, verify email, log in
- **Onboard**: Complete profile, set target score, select exam date, complete device check
- **Complete diagnostic**: Take all sections, receive estimated score, view results
- **Generate study plan**: Receive personalised plan, verify daily allocations
- **Complete practice**: Answer questions of each task type, submit responses, view feedback
- **Upload speaking response**: Record audio, upload, receive AI evaluation
- **Submit writing response**: Type essay, autosave, submit, receive evaluation
- **Complete mock**: Take full mock across all sections, submit, receive score report
- **Recover mock**: Interrupt mock, resume from interruption, complete and submit
- **Purchase subscription**: Select plan, complete payment, verify access to paid features
- **Complete teacher review**: Submit response for teacher review, receive feedback
- **Publish content**: Create question draft, submit for review, approve, publish, verify availability

## Stability Tests

Stability tests must verify the system recovers from failures:

- **API restart**: In-flight requests complete gracefully; queued requests processed after restart
- **Worker restart**: In-progress jobs resume or retry; queued jobs not lost
- **Redis restart**: Session data recovers from persistence; cache rebuilds correctly
- **Temporary database loss**: Connection retry; queue writes; data integrity on reconnect
- **Object-storage interruption**: Upload retry; fallback storage; notification on failure
- **Provider timeout**: Graceful timeout handling; fallback response; retry with backoff
- **Internet interruption**: Client-side response preservation; resync on reconnect; no data loss
- **Duplicate submission**: Idempotency key checking; no double scoring; no duplicate charges
- **Duplicate webhook**: Idempotency handling; single subscription activation; no duplicate processing

## Browser Matrix

The application must work correctly on:

| Browser | Minimum Version |
|---------|----------------|
| Chrome | Latest stable and previous major |
| Edge | Latest stable and previous major |
| Safari | Latest stable and previous major |
| Firefox | Latest stable and previous major |
| iPhone Safari | Latest iOS version |
| Android Chrome | Latest Android version |

Mobile-specific testing must include:

- Touch interaction for drag-and-drop, swipe, tap
- Viewport rendering at 375px, 414px and 768px widths
- Microphone access for speaking tasks
- Virtual keyboard behaviour for writing tasks
- Orientation change preservation
- Network type handling (5G, 4G, WiFi, offline)
