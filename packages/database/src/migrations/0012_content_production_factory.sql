-- Phase U — Content-Production Factory
-- Structural migration only. Not executed against live database.

CREATE TABLE IF NOT EXISTS content_factory_items (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  task_type TEXT NOT NULL,
  lifecycle_state TEXT NOT NULL DEFAULT 'draft',
  version INTEGER NOT NULL DEFAULT 1,
  author_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (author_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS content_factory_versions (
  id TEXT PRIMARY KEY,
  item_id TEXT NOT NULL,
  version INTEGER NOT NULL,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (item_id) REFERENCES content_factory_items(id)
);

CREATE TABLE IF NOT EXISTS content_import_jobs (
  id TEXT PRIMARY KEY,
  source_type TEXT NOT NULL,
  source_reference TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  item_count INTEGER NOT NULL DEFAULT 0,
  error_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS content_validation_runs (
  id TEXT PRIMARY KEY,
  content_id TEXT NOT NULL,
  version INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  started_at TEXT,
  completed_at TEXT,
  FOREIGN KEY (content_id) REFERENCES content_factory_items(id)
);

CREATE TABLE IF NOT EXISTS content_review_assignments (
  id TEXT PRIMARY KEY,
  content_id TEXT NOT NULL,
  reviewer_id TEXT NOT NULL,
  conflict_of_interest BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'assigned',
  FOREIGN KEY (content_id) REFERENCES content_factory_items(id),
  FOREIGN KEY (reviewer_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS content_publication_commands (
  id TEXT PRIMARY KEY,
  content_version_id TEXT NOT NULL,
  target_catalogue TEXT NOT NULL,
  effective_date TEXT NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'queued',
  published_at TEXT,
  FOREIGN KEY (content_version_id) REFERENCES content_factory_versions(id)
);

CREATE TABLE IF NOT EXISTS content_media_processing_jobs (
  id TEXT PRIMARY KEY,
  content_id TEXT NOT NULL,
  source_media_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  progress REAL NOT NULL DEFAULT 0,
  original_preserved BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (content_id) REFERENCES content_factory_items(id)
);

CREATE INDEX IF NOT EXISTS idx_factory_items_state ON content_factory_items(lifecycle_state);
CREATE INDEX IF NOT EXISTS idx_factory_items_author ON content_factory_items(author_id);
CREATE INDEX IF NOT EXISTS idx_validation_runs_content ON content_validation_runs(content_id);
CREATE INDEX IF NOT EXISTS idx_review_assignments_reviewer ON content_review_assignments(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_media_jobs_status ON content_media_processing_jobs(status);
