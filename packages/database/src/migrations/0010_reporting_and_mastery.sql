-- Phase R — Dashboard, Reports and Skill Mastery
-- Structural migration only. Not executed against live database.

CREATE TABLE IF NOT EXISTS report_snapshots (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  report_profile_id TEXT NOT NULL,
  snapshot_data TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  partial_data BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS mastery_snapshots (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  profile_id TEXT NOT NULL,
  profile_version INTEGER NOT NULL,
  levels TEXT NOT NULL,
  partial_data BOOLEAN NOT NULL DEFAULT FALSE,
  calculated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS report_exports (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  format TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  progress REAL NOT NULL DEFAULT 0,
  result_url TEXT,
  expires_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS report_generation_jobs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  job_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  progress REAL NOT NULL DEFAULT 0,
  correlation_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at TEXT
);

CREATE TABLE IF NOT EXISTS report_data_lineage (
  id TEXT PRIMARY KEY,
  report_id TEXT NOT NULL,
  source_result_id TEXT NOT NULL,
  source_attempt_id TEXT,
  question_version_id TEXT,
  scoring_profile_version INTEGER,
  calculated_at TEXT NOT NULL,
  freshness_status TEXT NOT NULL DEFAULT 'fresh',
  partial_data_status BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_report_snapshots_user ON report_snapshots(user_id);
CREATE INDEX IF NOT EXISTS idx_mastery_snapshots_user ON mastery_snapshots(user_id);
CREATE INDEX IF NOT EXISTS idx_report_exports_user ON report_exports(user_id);
CREATE INDEX IF NOT EXISTS idx_report_generation_jobs_status ON report_generation_jobs(status);
