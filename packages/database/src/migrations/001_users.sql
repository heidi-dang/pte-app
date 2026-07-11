CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'free_student',
  status TEXT NOT NULL DEFAULT 'pending_verification',
  display_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  timezone TEXT,
  locale TEXT DEFAULT 'en',
  email_notifications BOOLEAN NOT NULL DEFAULT true,
  target_score INTEGER,
  exam_date TIMESTAMPTZ,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users (email);
CREATE INDEX idx_users_role ON users (role);
