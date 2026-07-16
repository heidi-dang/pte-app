-- Migration: 0010_phase_l_speaking_recordings
-- Implements persistence tables for speaking recordings (Phase L)

CREATE TABLE speaking_recordings (
  id UUID PRIMARY KEY,
  attempt_id UUID NOT NULL REFERENCES question_attempts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recording_profile_id VARCHAR(255) NOT NULL,
  state VARCHAR(32) NOT NULL DEFAULT 'not-started'
    CHECK (state IN (
      'not-started', 'device-check', 'preparing', 'opening-microphone',
      'recording', 'stopping', 'locally-preserved', 'upload-queued',
      'uploading', 'upload-paused', 'upload-retrying', 'uploaded',
      'processing', 'available', 'failed', 'abandoned', 'expired'
    )),
  duration_ms INTEGER NOT NULL DEFAULT 0
    CHECK (duration_ms >= 0),
  media_object_id UUID REFERENCES media_metadata(id) ON DELETE SET NULL,
  upload_session_id UUID,
  uploaded_chunk_count INTEGER NOT NULL DEFAULT 0
    CHECK (uploaded_chunk_count >= 0),
  total_chunk_count INTEGER NOT NULL DEFAULT 0
    CHECK (total_chunk_count >= 0),
  checksum VARCHAR(255),
  finalisation_state VARCHAR(32) NOT NULL DEFAULT 'pending'
    CHECK (finalisation_state IN ('pending', 'finalised', 'rejected')),
  local_preservation_state VARCHAR(32) NOT NULL DEFAULT 'none'
    CHECK (local_preservation_state IN ('none', 'preserved', 'expired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_speaking_recordings_attempt ON speaking_recordings(attempt_id);
CREATE INDEX idx_speaking_recordings_user ON speaking_recordings(user_id);
CREATE INDEX idx_speaking_recordings_state ON speaking_recordings(state);
CREATE INDEX idx_speaking_recordings_created ON speaking_recordings(created_at);

CREATE TABLE recording_upload_sessions (
  id UUID PRIMARY KEY,
  recording_id UUID NOT NULL REFERENCES speaking_recordings(id) ON DELETE CASCADE,
  total_chunks INTEGER NOT NULL
    CHECK (total_chunks > 0),
  acknowledged_chunks INTEGER NOT NULL DEFAULT 0
    CHECK (acknowledged_chunks >= 0),
  acknowledged_sequence_numbers INTEGER[] NOT NULL DEFAULT '{}',
  state VARCHAR(32) NOT NULL DEFAULT 'active'
    CHECK (state IN ('active', 'paused', 'completed', 'failed', 'expired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_upload_session_recording UNIQUE (recording_id)
);

CREATE INDEX idx_upload_sessions_state ON recording_upload_sessions(state);
CREATE INDEX idx_upload_sessions_recording ON recording_upload_sessions(recording_id);

CREATE TABLE recording_upload_chunks (
  id UUID PRIMARY KEY,
  upload_session_id UUID NOT NULL REFERENCES recording_upload_sessions(id) ON DELETE CASCADE,
  sequence_number INTEGER NOT NULL
    CHECK (sequence_number >= 0),
  byte_count INTEGER NOT NULL
    CHECK (byte_count > 0),
  chunk_storage_key TEXT NOT NULL,
  checksum VARCHAR(255),
  acknowledged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_chunk_session_sequence UNIQUE (upload_session_id, sequence_number)
);

CREATE INDEX idx_upload_chunks_session ON recording_upload_chunks(upload_session_id);

CREATE TABLE recording_attempt_rights (
  id UUID PRIMARY KEY,
  recording_id UUID NOT NULL REFERENCES speaking_recordings(id) ON DELETE CASCADE,
  attempt_number INTEGER NOT NULL DEFAULT 1
    CHECK (attempt_number >= 1),
  permitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  consumed_at TIMESTAMPTZ,
  result VARCHAR(32)
    CHECK (result IS NULL OR result IN ('uploaded', 'failed', 'abandoned', 'expired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_right_recording_attempt UNIQUE (recording_id, attempt_number)
);

CREATE INDEX idx_attempt_rights_recording ON recording_attempt_rights(recording_id);
CREATE INDEX idx_attempt_rights_created ON recording_attempt_rights(created_at);

CREATE TABLE recording_processing_jobs (
  id UUID PRIMARY KEY,
  recording_id UUID NOT NULL REFERENCES speaking_recordings(id) ON DELETE CASCADE,
  state VARCHAR(32) NOT NULL DEFAULT 'queued'
    CHECK (state IN ('queued', 'processing', 'completed', 'failed')),
  progress INTEGER NOT NULL DEFAULT 0
    CHECK (progress >= 0 AND progress <= 100),
  current_stage VARCHAR(255),
  error_message TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0
    CHECK (retry_count >= 0),
  correlation_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_processing_jobs_recording ON recording_processing_jobs(recording_id);
CREATE INDEX idx_processing_jobs_state ON recording_processing_jobs(state);
