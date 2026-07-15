-- Migration: 0006_objective_scoring
-- Implements centralised objective scoring engine persistence (Phase N)

CREATE TABLE IF NOT EXISTS scoring_results (
  id TEXT PRIMARY KEY,
  attempt_id TEXT NOT NULL,
  question_version_id TEXT NOT NULL,
  scoring_profile_id TEXT NOT NULL,
  scoring_profile_version INTEGER NOT NULL,
  engine_version TEXT NOT NULL,
  raw_result REAL NOT NULL,
  bounded_result REAL NOT NULL,
  component_evidence TEXT NOT NULL DEFAULT '[]',
  no_response INTEGER NOT NULL DEFAULT 0,
  result_type TEXT NOT NULL DEFAULT 'original',
  supersedes_result_id TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX IF NOT EXISTS idx_scoring_results_attempt ON scoring_results(attempt_id);
CREATE INDEX IF NOT EXISTS idx_scoring_results_question ON scoring_results(question_version_id);
CREATE INDEX IF NOT EXISTS idx_scoring_results_profile ON scoring_results(scoring_profile_id);
CREATE INDEX IF NOT EXISTS idx_scoring_results_supersedes ON scoring_results(supersedes_result_id);

CREATE TABLE IF NOT EXISTS scoring_profiles (
  id TEXT PRIMARY KEY,
  version INTEGER NOT NULL,
  rules TEXT NOT NULL DEFAULT '[]',
  normalisation_enabled INTEGER NOT NULL DEFAULT 0,
  normalisation_method TEXT NOT NULL DEFAULT 'none',
  normalisation_reference_mean REAL,
  normalisation_reference_std_dev REAL,
  no_response_result REAL NOT NULL DEFAULT 0,
  no_response_reason TEXT NOT NULL DEFAULT 'profile-default',
  minimum_result REAL NOT NULL DEFAULT 0,
  maximum_result REAL NOT NULL DEFAULT 1,
  rounding_method TEXT NOT NULL DEFAULT 'none',
  rounding_decimal_places INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE(id, version)
);
