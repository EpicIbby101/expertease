-- Course curriculum: metadata, ordered lessons, per-user progress.
-- Access control stays in the app (Clerk + service role), consistent with companies/users patterns.

CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  full_description TEXT,
  category TEXT,
  difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  duration_hours NUMERIC(6, 2),
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_courses_published ON courses(is_published) WHERE is_published = true;

COMMENT ON TABLE courses IS 'Top-level training products; trainees enroll implicitly via progress for now';

CREATE TABLE IF NOT EXISTS lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  title TEXT NOT NULL,
  lesson_type TEXT NOT NULL DEFAULT 'reading' CHECK (
    lesson_type IN ('reading', 'video', 'quiz', 'assignment', 'download')
  ),
  duration_minutes INTEGER,
  body_markdown TEXT,
  resource_path TEXT,
  resource_bucket TEXT DEFAULT 'course-assets',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lessons_course_order ON lessons(course_id, sort_order);

COMMENT ON COLUMN lessons.body_markdown IS 'Primary on-page content; optional if lesson is asset-only';
COMMENT ON COLUMN lessons.resource_path IS 'Object path in Supabase Storage (see resource_bucket), e.g. courses/v1/module1.pdf';
COMMENT ON COLUMN lessons.resource_bucket IS 'Storage bucket name for resource_path';

CREATE TABLE IF NOT EXISTS lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, lesson_id)
);

CREATE INDEX IF NOT EXISTS idx_lesson_progress_user ON lesson_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_lesson ON lesson_progress(lesson_id);

COMMENT ON COLUMN lesson_progress.user_id IS 'Clerk user id (matches users.user_id)';

ALTER TABLE courses DISABLE ROW LEVEL SECURITY;
ALTER TABLE lessons DISABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_progress DISABLE ROW LEVEL SECURITY;
