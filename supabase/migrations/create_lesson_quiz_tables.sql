-- Skeleton: MCQ data per lesson (lesson_type = 'quiz'). RLS off; app uses service role + Clerk.
-- Extend later: shuffle, time limits, question banks, partial credit, etc.

CREATE TABLE IF NOT EXISTS lesson_quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  prompt TEXT NOT NULL,
  explanation TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lesson_quiz_questions_lesson ON lesson_quiz_questions(lesson_id, sort_order);

CREATE TABLE IF NOT EXISTS lesson_quiz_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES lesson_quiz_questions(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  label TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lesson_quiz_options_question ON lesson_quiz_options(question_id, sort_order);

-- Reserved for submit flow: store attempts + scores later.
CREATE TABLE IF NOT EXISTS lesson_quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  score_percent SMALLINT,
  passed BOOLEAN,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lesson_quiz_attempts_user_lesson ON lesson_quiz_attempts(user_id, lesson_id);

ALTER TABLE lesson_quiz_questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_quiz_options DISABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_quiz_attempts DISABLE ROW LEVEL SECURITY;
