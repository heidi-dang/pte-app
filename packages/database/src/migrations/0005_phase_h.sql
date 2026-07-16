-- Phase H: Course and Lesson Engine

-- Courses
CREATE TABLE courses (
  id UUID PRIMARY KEY,
  slug VARCHAR(255) NOT NULL,
  title VARCHAR(500) NOT NULL,
  summary TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  access_level VARCHAR(32) NOT NULL DEFAULT 'free' CHECK (access_level IN ('free', 'paid', 'entitlement')),
  difficulty VARCHAR(64) NOT NULL DEFAULT 'beginner',
  estimated_duration_minutes INTEGER NOT NULL DEFAULT 0,
  skill_tags JSONB NOT NULL DEFAULT '[]',
  thumbnail_media_id VARCHAR(255),
  status VARCHAR(32) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'retired')),
  version INTEGER NOT NULL DEFAULT 1,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  CONSTRAINT uq_course_slug UNIQUE (slug)
);

CREATE TABLE course_versions (
  id UUID PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES courses(id),
  version INTEGER NOT NULL,
  snapshot JSONB NOT NULL,
  reason VARCHAR(255) NOT NULL DEFAULT 'created',
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_course_version UNIQUE (course_id, version)
);

-- Modules
CREATE TABLE course_modules (
  id UUID PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES courses(id),
  title VARCHAR(500) NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  order_position INTEGER NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'retired')),
  version INTEGER NOT NULL DEFAULT 1,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_module_order UNIQUE (course_id, order_position)
);

-- Lessons
CREATE TABLE lessons (
  id UUID PRIMARY KEY,
  module_id UUID NOT NULL REFERENCES course_modules(id),
  course_id UUID NOT NULL REFERENCES courses(id),
  title VARCHAR(500) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  summary TEXT NOT NULL DEFAULT '',
  order_position INTEGER NOT NULL,
  is_optional BOOLEAN NOT NULL DEFAULT false,
  estimated_minutes INTEGER NOT NULL DEFAULT 10,
  quiz_id UUID,
  status VARCHAR(32) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'retired')),
  version INTEGER NOT NULL DEFAULT 1,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_lesson_slug UNIQUE (slug),
  CONSTRAINT uq_lesson_order UNIQUE (module_id, order_position)
);

CREATE TABLE lesson_versions (
  id UUID PRIMARY KEY,
  lesson_id UUID NOT NULL REFERENCES lessons(id),
  version INTEGER NOT NULL,
  snapshot JSONB NOT NULL,
  reason VARCHAR(255) NOT NULL DEFAULT 'created',
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_lesson_version UNIQUE (lesson_id, version)
);

-- Prerequisites
CREATE TABLE lesson_prerequisites (
  id UUID PRIMARY KEY,
  lesson_id UUID NOT NULL REFERENCES lessons(id),
  required_lesson_id UUID REFERENCES lessons(id),
  required_module_id UUID REFERENCES course_modules(id),
  required_course_id UUID REFERENCES courses(id),
  prerequisite_type VARCHAR(32) NOT NULL CHECK (prerequisite_type IN ('lesson_completion', 'module_completion', 'course_completion', 'entitlement')),
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT no_self_prereq CHECK (lesson_id != required_lesson_id)
);

-- Lesson blocks
CREATE TABLE lesson_blocks (
  id UUID PRIMARY KEY,
  lesson_id UUID NOT NULL REFERENCES lessons(id),
  lesson_version_id UUID NOT NULL REFERENCES lesson_versions(id),
  block_type VARCHAR(32) NOT NULL CHECK (block_type IN ('text', 'audio', 'video', 'interactive')),
  order_position INTEGER NOT NULL,
  title VARCHAR(500) NOT NULL DEFAULT '',
  content JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_block_order UNIQUE (lesson_version_id, order_position)
);

-- Enrolments
CREATE TABLE course_enrolments (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  course_id UUID NOT NULL REFERENCES courses(id),
  course_version_id UUID NOT NULL REFERENCES course_versions(id),
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  status VARCHAR(32) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  CONSTRAINT uq_enrolment UNIQUE (user_id, course_id)
);

-- Lesson progress
CREATE TABLE lesson_progress (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  enrolment_id UUID NOT NULL REFERENCES course_enrolments(id),
  course_id UUID NOT NULL REFERENCES courses(id),
  module_id UUID NOT NULL REFERENCES course_modules(id),
  lesson_id UUID NOT NULL REFERENCES lessons(id),
  lesson_version_id UUID NOT NULL REFERENCES lesson_versions(id),
  last_block_id UUID REFERENCES lesson_blocks(id),
  block_position INTEGER NOT NULL DEFAULT 0,
  progress_percentage REAL NOT NULL DEFAULT 0,
  status VARCHAR(32) NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  started_at TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  mutation_id VARCHAR(128),
  version INTEGER NOT NULL DEFAULT 1,
  CONSTRAINT uq_progress_mutation UNIQUE (user_id, lesson_id, mutation_id)
);

-- Lesson quizzes
CREATE TABLE lesson_quizzes (
  id UUID PRIMARY KEY,
  lesson_id UUID NOT NULL REFERENCES lessons(id),
  title VARCHAR(500) NOT NULL,
  pass_threshold REAL NOT NULL DEFAULT 0.6,
  is_required BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT uq_lesson_quiz UNIQUE (lesson_id)
);

CREATE TABLE lesson_quiz_items (
  id UUID PRIMARY KEY,
  quiz_id UUID NOT NULL REFERENCES lesson_quizzes(id),
  item_type VARCHAR(32) NOT NULL CHECK (item_type IN ('single_choice', 'multiple_choice', 'true_false')),
  question TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]',
  correct_answers JSONB NOT NULL DEFAULT '[]',
  order_position INTEGER NOT NULL DEFAULT 0,
  explanation TEXT NOT NULL DEFAULT ''
);

CREATE TABLE lesson_quiz_attempts (
  id UUID PRIMARY KEY,
  quiz_id UUID NOT NULL REFERENCES lesson_quizzes(id),
  user_id UUID NOT NULL REFERENCES users(id),
  score REAL NOT NULL DEFAULT 0,
  total_items INTEGER NOT NULL DEFAULT 0,
  passed BOOLEAN NOT NULL DEFAULT false,
  answers JSONB NOT NULL DEFAULT '[]',
  attempt_number INTEGER NOT NULL DEFAULT 1,
  submission_id VARCHAR(128) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_quiz_submission UNIQUE (quiz_id, user_id, submission_id)
);

-- Teacher notes
CREATE TABLE teacher_notes (
  id UUID PRIMARY KEY,
  entity_type VARCHAR(32) NOT NULL CHECK (entity_type IN ('course', 'module', 'lesson')),
  entity_id UUID NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  author_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_courses_status ON courses(status);
CREATE INDEX idx_courses_access ON courses(access_level);
CREATE INDEX idx_courses_slug ON courses(slug);
CREATE INDEX idx_modules_course ON course_modules(course_id);
CREATE INDEX idx_modules_order ON course_modules(course_id, order_position);
CREATE INDEX idx_lessons_module ON lessons(module_id);
CREATE INDEX idx_lessons_course ON lessons(course_id);
CREATE INDEX idx_lessons_order ON lessons(module_id, order_position);
CREATE INDEX idx_blocks_lesson ON lesson_blocks(lesson_id);
CREATE INDEX idx_blocks_version ON lesson_blocks(lesson_version_id);
CREATE INDEX idx_blocks_order ON lesson_blocks(lesson_version_id, order_position);
CREATE INDEX idx_enrolments_user ON course_enrolments(user_id);
CREATE INDEX idx_enrolments_course ON course_enrolments(course_id);
CREATE INDEX idx_progress_user ON lesson_progress(user_id);
CREATE INDEX idx_progress_enrolment ON lesson_progress(enrolment_id);
CREATE INDEX idx_progress_lesson ON lesson_progress(user_id, lesson_id);
CREATE INDEX idx_prereq_lesson ON lesson_prerequisites(lesson_id);
CREATE INDEX idx_quiz_lesson ON lesson_quizzes(lesson_id);
CREATE INDEX idx_quiz_attempts_user ON lesson_quiz_attempts(user_id);
CREATE INDEX idx_teacher_notes_entity ON teacher_notes(entity_type, entity_id);

-- Search index
CREATE INDEX idx_courses_search ON courses USING GIN (to_tsvector('english', title || ' ' || summary || ' ' || description));
