-- Migration: 0005_speaking_recordings
-- Implements persistence tables for speaking recordings (Phase L)

CREATE TABLE IF NOT EXISTS speaking_recordings (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES question_sessions(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  recording_profile_id TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'not-started',
  duration_ms INTEGER NOT NULL DEFAULT 0,
  media_object_id TEXT,
  upload_session_id TEXT,
  uploaded_chunk_count INTEGER NOT NULL DEFAULT 0,
  total_chunk_count INTEGER NOT NULL DEFAULT 0,
  checksum TEXT,
  finalisation_state TEXT NOT NULL DEFAULT 'pending',
  local_preservation_state TEXT NOT NULL DEFAULT 'none',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX IF NOT EXISTS idx_speaking_recordings_session ON speaking_recordings(session_id);
CREATE INDEX IF NOT EXISTS idx_speaking_recordings_user ON speaking_recordings(user_id);

CREATE TABLE IF NOT EXISTS recording_upload_sessions (
  id TEXT PRIMARY KEY,
  recording_id TEXT NOT NULL REFERENCES speaking_recordings(id),
  total_chunks INTEGER NOT NULL DEFAULT 0,
  acknowledged_chunks INTEGER NOT NULL DEFAULT 0,
  state TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE(recording_id)
);

CREATE TABLE IF NOT EXISTS recording_upload_chunks (
  id TEXT PRIMARY KEY,
  upload_session_id TEXT NOT NULL REFERENCES recording_upload_sessions(id),
  sequence_number INTEGER NOT NULL,
  acknowledged_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE(upload_session_id, sequence_number)
);

CREATE TABLE IF NOT EXISTS recording_attempt_rights (
  id TEXT PRIMARY KEY,
  recording_id TEXT NOT NULL REFERENCES speaking_recordings(id),
  permitted_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  consumed_at TEXT,
  result TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX IF NOT EXISTS idx_recording_attempt_rights_recording ON recording_attempt_rights(recording_id);

CREATE TABLE IF NOT EXISTS recording_processing_jobs (
  id TEXT PRIMARY KEY,
  recording_id TEXT NOT NULL REFERENCES speaking_recordings(id),
  state TEXT NOT NULL DEFAULT 'queued',
  progress NUMERIC DEFAULT 0,
  current_stage TEXT,
  error_message TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,
  correlation_id TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX IF NOT EXISTS idx_recording_processing_jobs_recording ON recording_processing_jobs(recording_id);
CREATE INDEX IF NOT EXISTS idx_recording_processing_jobs_state ON recording_processing_jobs(state);
