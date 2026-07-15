-- Migration: 0004_question_engine
-- Implements persistence tables for the Universal Question Engine (Phase I)

CREATE TABLE IF NOT EXISTS question_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  question_id TEXT NOT NULL,
  question_version_id TEXT NOT NULL,
  question_type TEXT NOT NULL,
  mode TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'created',
  timing_profile_id TEXT,
  playback_profile_id TEXT,
  scoring_profile_id TEXT,
  server_deadline TEXT,
  started_at TEXT,
  paused_at TEXT,
  submitted_at TEXT,
  expired_at TEXT,
  abandoned_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX IF NOT EXISTS idx_question_sessions_user_id ON question_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_question_sessions_state ON question_sessions(state);

CREATE TABLE IF NOT EXISTS question_session_responses (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES question_sessions(id),
  revision INTEGER NOT NULL,
  response_state TEXT NOT NULL,
  response_payload TEXT NOT NULL,
  question_version_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE(session_id, revision)
);

CREATE TABLE IF NOT EXISTS question_session_submissions (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES question_sessions(id),
  question_version_id TEXT NOT NULL,
  response_revision INTEGER NOT NULL,
  response_payload TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  request_fingerprint TEXT NOT NULL,
  submitted_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE(session_id)
);

CREATE TABLE IF NOT EXISTS question_session_events (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES question_sessions(id),
  sequence INTEGER NOT NULL,
  event_type TEXT NOT NULL,
  event_payload TEXT NOT NULL DEFAULT '{}',
  occurred_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE(session_id, sequence)
);

CREATE INDEX IF NOT EXISTS idx_question_session_events_session ON question_session_events(session_id, sequence);

CREATE TABLE IF NOT EXISTS question_playback_rights (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES question_sessions(id),
  playback_profile_id TEXT NOT NULL,
  allowed_plays INTEGER NOT NULL,
  consumed_plays INTEGER NOT NULL DEFAULT 0,
  state TEXT NOT NULL DEFAULT 'allowed',
  started_at TEXT,
  consumed_at TEXT,
  completed_at TEXT,
  failure_state TEXT,
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS question_idempotency_records (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES question_sessions(id),
  idempotency_key TEXT NOT NULL,
  request_fingerprint TEXT NOT NULL,
  result_payload TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE(session_id, idempotency_key)
);
