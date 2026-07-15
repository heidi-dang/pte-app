-- Phase S — Teacher and Administration Portals
-- Structural migration only. Not executed against live database.

CREATE TABLE IF NOT EXISTS teacher_student_assignments (
  id TEXT PRIMARY KEY,
  teacher_id TEXT NOT NULL,
  student_id TEXT NOT NULL,
  effective_from TEXT NOT NULL,
  effective_to TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (teacher_id) REFERENCES users(id),
  FOREIGN KEY (student_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS teacher_assignments (
  id TEXT PRIMARY KEY,
  teacher_id TEXT NOT NULL,
  title TEXT NOT NULL,
  instructions TEXT NOT NULL,
  content_references TEXT NOT NULL DEFAULT '[]',
  due_date_profile TEXT NOT NULL,
  availability_period TEXT NOT NULL,
  completion_policy TEXT NOT NULL DEFAULT 'all',
  version INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (teacher_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS assignment_targets (
  assignment_id TEXT NOT NULL,
  student_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'assigned',
  submitted_at TEXT,
  response_references TEXT NOT NULL DEFAULT '[]',
  PRIMARY KEY (assignment_id, student_id),
  FOREIGN KEY (assignment_id) REFERENCES teacher_assignments(id),
  FOREIGN KEY (student_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS teacher_feedback (
  id TEXT PRIMARY KEY,
  attempt_id TEXT NOT NULL,
  teacher_id TEXT NOT NULL,
  written_feedback TEXT,
  audio_feedback_media_id TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  version INTEGER NOT NULL DEFAULT 1,
  author TEXT NOT NULL,
  student_visible BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS teacher_feedback_versions (
  id TEXT PRIMARY KEY,
  feedback_id TEXT NOT NULL,
  version INTEGER NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (feedback_id) REFERENCES teacher_feedback(id)
);

CREATE TABLE IF NOT EXISTS response_review_locks (
  id TEXT PRIMARY KEY,
  review_id TEXT NOT NULL UNIQUE,
  owner_id TEXT NOT NULL,
  acquired_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  FOREIGN KEY (owner_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS staff_impersonation_sessions (
  id TEXT PRIMARY KEY,
  impersonator_id TEXT NOT NULL,
  target_user_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  started_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  FOREIGN KEY (impersonator_id) REFERENCES users(id),
  FOREIGN KEY (target_user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS sensitive_action_confirmations (
  id TEXT PRIMARY KEY,
  action_type TEXT NOT NULL,
  reason TEXT NOT NULL,
  expected_target_state TEXT NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending',
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_teacher_student_teacher ON teacher_student_assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_assignments_teacher ON teacher_assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_feedback_attempt ON teacher_feedback(attempt_id);
CREATE INDEX IF NOT EXISTS idx_review_locks_review ON response_review_locks(review_id);
CREATE INDEX IF NOT EXISTS idx_impersonation_status ON staff_impersonation_sessions(status);
