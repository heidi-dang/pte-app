CREATE TABLE IF NOT EXISTS content_items (
  id TEXT PRIMARY KEY,
  task_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  version INTEGER NOT NULL DEFAULT 1,
  title TEXT NOT NULL,
  instructions TEXT NOT NULL DEFAULT '',
  prompt JSONB NOT NULL DEFAULT '{}',
  correct_answer JSONB,
  rubric JSONB,
  difficulty REAL NOT NULL DEFAULT 0.5,
  skills TEXT[] NOT NULL DEFAULT '{}',
  time_limit_seconds INTEGER,
  source TEXT NOT NULL DEFAULT 'original',
  author_id TEXT,
  licence_ref TEXT,
  attribution TEXT,
  reviewed_by_id TEXT,
  reviewed_at TIMESTAMPTZ,
  source_file TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ
);

CREATE INDEX idx_content_task_type ON content_items (task_type);
CREATE INDEX idx_content_status ON content_items (status);
