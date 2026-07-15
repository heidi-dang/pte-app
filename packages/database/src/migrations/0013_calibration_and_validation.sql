-- Phase V — Calibration and Educational Validation
-- Structural migration only. Not executed against live database.

CREATE TABLE IF NOT EXISTS calibration_datasets (
  id TEXT PRIMARY KEY,
  version INTEGER NOT NULL DEFAULT 1,
  task_type TEXT NOT NULL,
  expert_review_status TEXT NOT NULL DEFAULT 'pending',
  activation_status TEXT NOT NULL DEFAULT 'inactive',
  provenance TEXT NOT NULL,
  immutable BOOLEAN NOT NULL DEFAULT FALSE,
  created_by_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (created_by_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS calibration_samples (
  id TEXT PRIMARY KEY,
  dataset_id TEXT NOT NULL,
  response_reference TEXT NOT NULL,
  question_version_id TEXT NOT NULL,
  agreement_status TEXT NOT NULL DEFAULT 'pending',
  confidence REAL NOT NULL DEFAULT 0,
  FOREIGN KEY (dataset_id) REFERENCES calibration_datasets(id)
);

CREATE TABLE IF NOT EXISTS expert_reviews (
  id TEXT PRIMARY KEY,
  sample_id TEXT NOT NULL,
  reviewer_id TEXT NOT NULL,
  overall_score REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (sample_id) REFERENCES calibration_samples(id),
  FOREIGN KEY (reviewer_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS calibration_runs (
  id TEXT PRIMARY KEY,
  dataset_id TEXT NOT NULL,
  profile_id TEXT NOT NULL,
  profile_version INTEGER NOT NULL,
  metrics TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'running',
  started_at TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at TEXT,
  FOREIGN KEY (dataset_id) REFERENCES calibration_datasets(id)
);

CREATE TABLE IF NOT EXISTS calibration_reports (
  id TEXT PRIMARY KEY,
  version INTEGER NOT NULL DEFAULT 1,
  dataset_id TEXT NOT NULL,
  immutable BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  approved_at TEXT,
  FOREIGN KEY (dataset_id) REFERENCES calibration_datasets(id)
);

CREATE TABLE IF NOT EXISTS profile_promotion_decisions (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL,
  candidate_version INTEGER NOT NULL,
  passed BOOLEAN NOT NULL,
  failures TEXT NOT NULL DEFAULT '[]',
  decided_by_id TEXT NOT NULL,
  decided_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (decided_by_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS profile_rollback_decisions (
  id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL,
  candidate_version INTEGER NOT NULL,
  original_version INTEGER NOT NULL,
  reason TEXT NOT NULL,
  silent_overwrite BOOLEAN NOT NULL DEFAULT FALSE,
  decided_by_id TEXT NOT NULL,
  decided_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (decided_by_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_calibration_dataset_type ON calibration_datasets(task_type);
CREATE INDEX IF NOT EXISTS idx_calibration_samples_dataset ON calibration_samples(dataset_id);
CREATE INDEX IF NOT EXISTS idx_calibration_runs_profile ON calibration_runs(profile_id);
