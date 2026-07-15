-- Phase H: add status columns to version tables and support deterministic version resolution
ALTER TABLE course_versions ADD COLUMN IF NOT EXISTS status VARCHAR(32) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'retired'));
ALTER TABLE lesson_versions ADD COLUMN IF NOT EXISTS status VARCHAR(32) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'retired'));

CREATE INDEX IF NOT EXISTS idx_course_versions_status ON course_versions(course_id, status, version DESC);
CREATE INDEX IF NOT EXISTS idx_lesson_versions_status ON lesson_versions(lesson_id, status, version DESC);
