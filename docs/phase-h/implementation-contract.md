# Phase H Implementation Contract

## Scope

Course and Lesson Engine for PTE students. Browse, enrol, study, resume, complete courses with quizzes and prerequisites.

## Key Design Decisions

- All progress is server-authoritative
- Enrolment is idempotent (UNIQUE on user_id + course_id)
- Progress mutations use client-generated mutationIds with DB uniqueness
- Quiz attempts are idempotent (UNIQUE on quiz_id + user_id + submissionId)
- Teacher notes are never returned to students
- Version traceability via course_versions and lesson_versions tables
- Additive migration 0004 — no destructive changes to existing schema
- Fastify plugin registered at parent scope (no encapsulation issue)

## Ownership

Phase H — Dev 1 only. No Phase I/J/K code included.
