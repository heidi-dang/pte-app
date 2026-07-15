-- Migration: 0008_diagnostics_study_plans
-- Implements diagnostic test and study plan persistence (Phase P)

CREATE TABLE IF NOT EXISTS diagnostic_blueprints (
  id TEXT PRIMARY KEY,
  version INTEGER NOT NULL,
  included_skills TEXT NOT NULL DEFAULT '[]',
  task_distribution TEXT NOT NULL DEFAULT '[]',
  difficulty_distribution TEXT NOT NULL DEFAULT '{}',
  selection_policy TEXT NOT NULL DEFAULT '{}',
  minimum_evidence INTEGER NOT NULL DEFAULT 1,
  partial_result_policy TEXT NOT NULL DEFAULT '{}',
  scoring_profile_references TEXT NOT NULL DEFAULT '[]',
  estimated_result_mapping TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE(id, version)
);

CREATE TABLE IF NOT EXISTS diagnostic_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  blueprint_id TEXT NOT NULL,
  blueprint_version INTEGER NOT NULL,
  state TEXT NOT NULL DEFAULT 'created',
  selected_questions TEXT NOT NULL DEFAULT '[]',
  completed_tasks INTEGER NOT NULL DEFAULT 0,
  total_tasks INTEGER NOT NULL DEFAULT 0,
  started_at TEXT,
  completed_at TEXT,
  partial_result_id TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX IF NOT EXISTS idx_diagnostic_sessions_user ON diagnostic_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_diagnostic_sessions_state ON diagnostic_sessions(state);

CREATE TABLE IF NOT EXISTS skill_profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  diagnostic_session_id TEXT NOT NULL,
  skills TEXT NOT NULL DEFAULT '[]',
  confidence REAL NOT NULL DEFAULT 0,
  missing_evidence TEXT NOT NULL DEFAULT '[]',
  weakness_rationale TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX IF NOT EXISTS idx_skill_profiles_user ON skill_profiles(user_id);

CREATE TABLE IF NOT EXISTS diagnostic_reports (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  skill_profile_id TEXT NOT NULL,
  weaknesses TEXT NOT NULL DEFAULT '[]',
  target_gaps TEXT NOT NULL DEFAULT '[]',
  overall_estimated_score REAL NOT NULL DEFAULT 0,
  recommendations TEXT NOT NULL DEFAULT '[]',
  is_partial INTEGER NOT NULL DEFAULT 0,
  generated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS study_plans (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  diagnostic_report_id TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  daily_activities TEXT NOT NULL DEFAULT '[]',
  weekly_goals TEXT NOT NULL DEFAULT '[]',
  target_score_gap REAL NOT NULL DEFAULT 0,
  exam_date TEXT NOT NULL,
  available_study_days INTEGER NOT NULL DEFAULT 5,
  session_duration_minutes INTEGER NOT NULL DEFAULT 30,
  content_references TEXT NOT NULL DEFAULT '[]',
  priority_skills TEXT NOT NULL DEFAULT '[]',
  plan_version INTEGER NOT NULL DEFAULT 1,
  regeneration_reason TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX IF NOT EXISTS idx_study_plans_user ON study_plans(user_id);

CREATE TABLE IF NOT EXISTS plan_regenerations (
  id TEXT PRIMARY KEY,
  plan_id TEXT NOT NULL,
  previous_version INTEGER NOT NULL,
  new_version INTEGER NOT NULL,
  reason TEXT NOT NULL,
  previous_plan_snapshot TEXT NOT NULL DEFAULT '{}',
  generated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
