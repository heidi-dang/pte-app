-- Migration: 0007_open_response_evaluation
-- Implements provider-neutral evaluation persistence (Phase O)

CREATE TABLE IF NOT EXISTS evaluation_results (
  id TEXT PRIMARY KEY,
  response_id TEXT NOT NULL,
  question_version_id TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  provider_version TEXT NOT NULL,
  evaluation_profile_version INTEGER NOT NULL,
  scoring_profile_version INTEGER NOT NULL,
  result_classification TEXT NOT NULL DEFAULT 'estimated-training-result',
  estimated_score REAL NOT NULL,
  component_evidence TEXT NOT NULL DEFAULT '[]',
  confidence REAL NOT NULL,
  warnings TEXT NOT NULL DEFAULT '[]',
  limitations TEXT NOT NULL DEFAULT '[]',
  correlation_id TEXT NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX IF NOT EXISTS idx_evaluation_results_response ON evaluation_results(response_id);
CREATE INDEX IF NOT EXISTS idx_evaluation_results_correlation ON evaluation_results(correlation_id);
CREATE INDEX IF NOT EXISTS idx_evaluation_results_provider ON evaluation_results(provider_id);

CREATE TABLE IF NOT EXISTS evaluation_jobs (
  id TEXT PRIMARY KEY,
  response_id TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'queued',
  progress NUMERIC DEFAULT 0,
  current_stage TEXT,
  provider_id TEXT,
  error_message TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,
  correlation_id TEXT,
  idempotency_key TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX IF NOT EXISTS idx_evaluation_jobs_state ON evaluation_jobs(state);
CREATE INDEX IF NOT EXISTS idx_evaluation_jobs_response ON evaluation_jobs(response_id);
