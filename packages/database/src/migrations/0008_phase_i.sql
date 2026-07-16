-- Phase I: Universal Question Engine

-- Question Sessions
CREATE TABLE question_sessions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  lesson_id UUID NOT NULL REFERENCES lessons(id),
  mode VARCHAR(32) NOT NULL CHECK (mode IN ('learning', 'review', 'timed', 'mock')),
  status VARCHAR(32) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'expired', 'recovered')),
  current_attempt_id UUID,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Question Version Snapshots (immutable copy of question at time of attempt)
CREATE TABLE question_version_snapshots (
  id UUID PRIMARY KEY,
  question_id UUID NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  task_type VARCHAR(64) NOT NULL,
  prompt JSONB NOT NULL,
  media_refs JSONB NOT NULL DEFAULT '[]',
  scoring_principles JSONB NOT NULL DEFAULT '[]',
  time_limit_seconds INTEGER,
  preparation_seconds INTEGER,
  snapshot JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Question Attempts
CREATE TABLE question_attempts (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  question_id UUID NOT NULL,
  lesson_id UUID NOT NULL REFERENCES lessons(id),
  session_id UUID NOT NULL REFERENCES question_sessions(id),
  status VARCHAR(32) NOT NULL DEFAULT 'created'
    CHECK (status IN ('created', 'in_progress', 'autosaved', 'submitted', 'reviewable', 'expired', 'interrupted', 'recovered')),
  mode VARCHAR(32) NOT NULL CHECK (mode IN ('learning', 'review', 'timed', 'mock')),
  version_snapshot_id UUID REFERENCES question_version_snapshots(id),
  response JSONB,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_autosaved_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  time_limit_seconds INTEGER,
  idempotency_key VARCHAR(255),
  play_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_attempt_idempotency UNIQUE (user_id, lesson_id, idempotency_key)
);

-- Playback Consumption Tracking (for Phase K Listening foundation)
CREATE TABLE playback_consumption (
  id UUID PRIMARY KEY,
  attempt_id UUID NOT NULL REFERENCES question_attempts(id),
  user_id UUID NOT NULL REFERENCES users(id),
  media_id VARCHAR(255) NOT NULL,
  play_count INTEGER NOT NULL DEFAULT 0,
  max_plays INTEGER NOT NULL DEFAULT 0,
  first_played_at TIMESTAMPTZ,
  last_played_at TIMESTAMPTZ,
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_playback_attempt_media UNIQUE (attempt_id, media_id)
);

-- Indexes for session lookup
CREATE INDEX idx_question_sessions_user ON question_sessions(user_id);
CREATE INDEX idx_question_sessions_lesson ON question_sessions(lesson_id);
CREATE INDEX idx_question_sessions_status ON question_sessions(status);

-- Indexes for attempt lookup
CREATE INDEX idx_question_attempts_user ON question_attempts(user_id);
CREATE INDEX idx_question_attempts_session ON question_attempts(session_id);
CREATE INDEX idx_question_attempts_lesson ON question_attempts(lesson_id);
CREATE INDEX idx_question_attempts_status ON question_attempts(status);
CREATE INDEX idx_question_attempts_idempotency ON question_attempts(user_id, lesson_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

-- Indexes for playback lookup
CREATE INDEX idx_playback_consumption_attempt ON playback_consumption(attempt_id);
CREATE INDEX idx_playback_consumption_user ON playback_consumption(user_id);

-- Indexes for snapshot lookup
CREATE INDEX idx_question_version_snapshots_question ON question_version_snapshots(question_id);
