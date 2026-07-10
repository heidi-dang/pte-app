# Content Workflow

## Stages

Idea → Draft → Automated Validation → Writer Review → PTE Specialist Review → Media Production → Technical Validation → Pilot → Approval → Publication → Monitoring → Revision or Retirement

## Stage Details

### Idea

- **Responsible role**: Content writer
- **Entry requirements**: Content gap or curriculum requirement identified
- **Required checks**: Not a duplicate of existing content; aligns with PTE Academic task types
- **Possible outcomes**: Approved for drafting; Rejected (duplicate or irrelevant); Deferred
- **Audit information**: Creator, date, source of idea, rationale
- **Rejection path**: Rejected ideas are logged with reason

### Draft

- **Responsible role**: Content writer
- **Entry requirements**: Approved idea
- **Required checks**: Follows content template for the task type; covers required difficulty range; no copyrighted material included
- **Possible outcomes**: Completed draft; Returned for revision
- **Audit information**: Draft version, creation date, writer identity
- **Rejection path**: Writer revises and resubmits

### Automated Validation

- **Responsible role**: System
- **Entry requirements**: Completed draft
- **Required checks**: Text within length limits; answer format valid; no prohibited content detected; all metadata fields populated; duplicate detection
- **Possible outcomes**: Passed; Failed with error report
- **Audit information**: Validation timestamp, checks performed, results
- **Rejection path**: Writer receives error report and revises

### Writer Review

- **Responsible role**: Content writer (self-review or peer)
- **Entry requirements**: Passed automated validation
- **Required checks**: Content accuracy; clarity; PTE relevance; difficulty appropriate
- **Possible outcomes**: Approved; Revision needed
- **Audit information**: Reviewer, review date, changes requested
- **Rejection path**: Writer revises based on feedback

### PTE Specialist Review

- **Responsible role**: Content reviewer
- **Entry requirements**: Passed writer review
- **Required checks**: PTE task format accuracy; timing alignment; scoring component alignment; answer correctness; cultural appropriateness
- **Possible outcomes**: Approved (score 9/10 or above); Rejected (score below 9/10); Revision needed
- **Audit information**: Reviewer, review score, review date, specific feedback
- **Rejection path**: Content returned to writer with detailed revision requirements

### Media Production

- **Responsible role**: Content writer or media specialist
- **Entry requirements**: Approved content draft
- **Required checks**: Audio recording quality; image resolution; file format compliance; accessibility requirements
- **Possible outcomes**: Media produced; Production failed
- **Audit information**: Producer, media files, format, date
- **Rejection path**: Content writer revises or requests new media

### Technical Validation

- **Responsible role**: System
- **Entry requirements**: Approved content with media
- **Required checks**: Question renders correctly in practice and mock mode; audio plays; timer works; scoring executes; response collection works; mobile compatibility
- **Possible outcomes**: Passed; Failed with error report
- **Audit information**: Validation timestamp, environment, results
- **Rejection path**: Technical team fixes issue; content re-validated

### Pilot

- **Responsible role**: Content reviewer or administrator
- **Entry requirements**: Passed technical validation
- **Required checks**: Small group of test students complete the content; scores are reasonable; no technical issues reported; feedback collected
- **Possible outcomes**: Approved; Issues found (return for fixes)
- **Audit information**: Pilot group, results, feedback summary
- **Rejection path**: Issues resolved and content re-piloted if needed

### Approval

- **Responsible role**: Content reviewer or administrator
- **Entry requirements**: Passed all previous stages
- **Required checks**: Final quality check; all metadata complete; review score documented
- **Possible outcomes**: Approved for publication
- **Audit information**: Approver, approval date
- **Rejection path**: Content returned to appropriate earlier stage

### Publication

- **Responsible role**: System (triggered by approval)
- **Entry requirements**: Approved content
- **Required checks**: Immutable version created; content indexed; available for practice sessions
- **Possible outcomes**: Published; Publication failed
- **Audit information**: Publication timestamp, version number, published by
- **Rejection path**: Admin intervenes if publication fails

### Monitoring

- **Responsible role**: Content reviewer, administrator
- **Entry requirements**: Published content
- **Required checks**: Performance metrics; student feedback; error reports; scoring distribution
- **Possible outcomes**: No issues found; Issues identified
- **Audit information**: Monitoring schedule, metrics tracked
- **Rejection path**: Content queued for revision or retirement

### Revision or Retirement

- **Responsible role**: Content reviewer, administrator
- **Entry requirements**: Issues identified during monitoring or curriculum update
- **Required checks**: Revision scope defined; retirement impact assessed for historical reports
- **Possible outcomes**: Content revised (new version published); Content retired (marked inactive for new sessions but available in historical reports)
- **Audit information**: Revision reason, changes made, version increment; or retirement reason, date
- **Rejection path**: Decision escalated to super administrator if disputed
