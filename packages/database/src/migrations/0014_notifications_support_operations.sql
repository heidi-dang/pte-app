-- Phase W — Notifications, Support and Operations
-- Structural migration only. Not executed against live database.

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  channel TEXT NOT NULL,
  preference_category TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'normal',
  status TEXT NOT NULL DEFAULT 'queued',
  delivery_attempts INTEGER NOT NULL DEFAULT 0,
  correlation_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  delivered_at TEXT,
  failed_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS notification_preferences (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  channel TEXT NOT NULL,
  category TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  locale TEXT NOT NULL DEFAULT 'en',
  mandatory BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS notification_deliveries (
  id TEXT PRIMARY KEY,
  notification_id TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  attempted_at TEXT NOT NULL DEFAULT (datetime('now')),
  delivered_at TEXT,
  FOREIGN KEY (notification_id) REFERENCES notifications(id)
);

CREATE TABLE IF NOT EXISTS support_cases (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  category TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'normal',
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS support_case_events (
  id TEXT PRIMARY KEY,
  case_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  body TEXT,
  visibility TEXT NOT NULL DEFAULT 'public',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (case_id) REFERENCES support_cases(id)
);

CREATE TABLE IF NOT EXISTS operation_retry_requests (
  id TEXT PRIMARY KEY,
  original_job_id TEXT NOT NULL,
  failure_reason TEXT NOT NULL,
  retry_count INTEGER NOT NULL DEFAULT 0,
  idempotency_key TEXT NOT NULL UNIQUE,
  original_job_preserved BOOLEAN NOT NULL DEFAULT TRUE,
  status TEXT NOT NULL DEFAULT 'requested',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS scoring_recovery_requests (
  id TEXT PRIMARY KEY,
  response_id TEXT NOT NULL,
  original_evaluation_id TEXT NOT NULL,
  original_response_preserved BOOLEAN NOT NULL DEFAULT TRUE,
  action TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'requested',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS incidents (
  id TEXT PRIMARY KEY,
  severity TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'detected',
  affected_capability TEXT NOT NULL,
  started_at TEXT NOT NULL DEFAULT (datetime('now')),
  resolved_at TEXT
);

CREATE TABLE IF NOT EXISTS backup_verification_runs (
  id TEXT PRIMARY KEY,
  backup_reference TEXT NOT NULL,
  integrity_result TEXT NOT NULL,
  verified_at TEXT NOT NULL DEFAULT (datetime('now')),
  status TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_export_jobs (
  id TEXT PRIMARY KEY,
  requested_by_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  progress REAL NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (requested_by_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS retention_jobs (
  id TEXT PRIMARY KEY,
  policy_version INTEGER NOT NULL,
  target_data_class TEXT NOT NULL,
  preview BOOLEAN NOT NULL DEFAULT TRUE,
  dry_run BOOLEAN NOT NULL DEFAULT TRUE,
  status TEXT NOT NULL DEFAULT 'preview',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
CREATE INDEX IF NOT EXISTS idx_support_cases_user ON support_cases(user_id);
CREATE INDEX IF NOT EXISTS idx_support_cases_status ON support_cases(status);
CREATE INDEX IF NOT EXISTS idx_support_case_events_case ON support_case_events(case_id);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_retention_jobs_class ON retention_jobs(target_data_class);
