-- Migration: 0009_mock_exam_engine
-- Implements mock exam engine persistence (Phase Q)

CREATE TABLE IF NOT EXISTS mock_blueprints (
  id TEXT PRIMARY KEY,
  version INTEGER NOT NULL,
  test_type TEXT NOT NULL,
  section_order TEXT NOT NULL DEFAULT '[]',
  task_distribution TEXT NOT NULL DEFAULT '[]',
  task_quantity_rules TEXT NOT NULL DEFAULT '{}',
  selection_policy TEXT NOT NULL DEFAULT '{}',
  timing_profile_id TEXT NOT NULL,
  playback_profiles TEXT NOT NULL DEFAULT '{}',
  recording_profiles TEXT NOT NULL DEFAULT '{}',
  scoring_profiles TEXT NOT NULL DEFAULT '{}',
  evaluation_profiles TEXT NOT NULL DEFAULT '{}',
  no_response_policy TEXT NOT NULL DEFAULT '{}',
  navigation_policy TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE(id, version)
);

CREATE TABLE IF NOT EXISTS mock_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  blueprint_id TEXT NOT NULL,
  blueprint_version INTEGER NOT NULL,
  server_deadline TEXT NOT NULL,
  current_section TEXT NOT NULL DEFAULT '',
  current_task_position INTEGER NOT NULL DEFAULT 0,
  selected_questions TEXT NOT NULL DEFAULT '[]',
  responses TEXT NOT NULL DEFAULT '[]',
  playback_state TEXT NOT NULL DEFAULT '{}',
  recording_state TEXT NOT NULL DEFAULT '{}',
  progress_completed_tasks INTEGER NOT NULL DEFAULT 0,
  progress_total_tasks INTEGER NOT NULL DEFAULT 0,
  progress_current_section_tasks INTEGER NOT NULL DEFAULT 0,
  progress_total_section_tasks INTEGER NOT NULL DEFAULT 0,
  submission_submitted INTEGER NOT NULL DEFAULT 0,
  submission_idempotency_key TEXT,
  submission_submitted_at TEXT,
  scoring_workflow_state TEXT NOT NULL DEFAULT 'idle',
  scoring_workflow_job_id TEXT,
  scoring_workflow_started_at TEXT,
  scoring_workflow_completed_at TEXT,
  result_id TEXT,
  state TEXT NOT NULL DEFAULT 'created',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  started_at TEXT,
  submitted_at TEXT,
  expired_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_mock_sessions_user ON mock_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_mock_sessions_state ON mock_sessions(state);
CREATE INDEX IF NOT EXISTS idx_mock_sessions_deadline ON mock_sessions(server_deadline);

CREATE TABLE IF NOT EXISTS mock_results (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES mock_sessions(id),
  blueprint_id TEXT NOT NULL,
  blueprint_version INTEGER NOT NULL,
  result_classification TEXT NOT NULL DEFAULT 'estimated-training-result',
  section_scores TEXT NOT NULL DEFAULT '[]',
  overall_score REAL NOT NULL DEFAULT 0,
  scoring_profile_versions TEXT NOT NULL DEFAULT '{}',
  evaluation_profile_versions TEXT NOT NULL DEFAULT '{}',
  is_complete INTEGER NOT NULL DEFAULT 0,
  missing_components TEXT NOT NULL DEFAULT '[]',
  confidence REAL NOT NULL DEFAULT 0,
  component_evidence TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX IF NOT EXISTS idx_mock_results_session ON mock_sessions(id);

CREATE TABLE IF NOT EXISTS mock_scoring_jobs (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES mock_sessions(id),
  submission_id TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'queued',
  progress NUMERIC DEFAULT 0,
  current_stage TEXT,
  error_message TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,
  correlation_id TEXT,
  idempotency_key TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX IF NOT EXISTS idx_mock_scoring_jobs_state ON mock_scoring_jobs(state);
CREATE INDEX IF NOT EXISTS idx_mock_scoring_jobs_session ON mock_scoring_jobs(session_id);
