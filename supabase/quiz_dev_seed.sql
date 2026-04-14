-- Run in Supabase → SQL Editor after `create_lesson_quiz_tables.sql` is applied.
--
-- Find a course id (pick one row, copy `id`):
--   SELECT id, slug, title, is_published FROM courses ORDER BY created_at DESC;
--
-- List lessons on that course:
--   SELECT id, sort_order, title, lesson_type FROM lessons WHERE course_id = 'YOUR_COURSE_ID' ORDER BY sort_order;
--
-- Optional — turn an existing lesson into a quiz (then add questions in Table Editor or with INSERTs):
--   UPDATE lessons SET lesson_type = 'quiz', body_markdown = coalesce(body_markdown, 'Quiz intro.')
--   WHERE id = 'YOUR_LESSON_ID';
-- 1) Optional: set v_course_override to a specific published course id.
--    Leave as nil UUID to auto-pick the newest published course.
-- 2) Run the whole block once. Check Messages for the new lesson id + URL.

DO $$
DECLARE
  v_course_override uuid := '00000000-0000-0000-0000-000000000000'; -- <-- or paste a real course id here
  v_course_id uuid;
  v_lesson_id uuid;
  v_q1 uuid;
  v_q2 uuid;
  v_next_sort int;
BEGIN
  IF v_course_override <> '00000000-0000-0000-0000-000000000000'::uuid THEN
    v_course_id := v_course_override;
  ELSE
    SELECT c.id INTO v_course_id
    FROM courses c
    WHERE c.is_published = true
    ORDER BY c.created_at DESC NULLS LAST
    LIMIT 1;
  END IF;

  IF v_course_id IS NULL THEN
    RAISE EXCEPTION
      'No published course found (is_published = true). Publish one in Table Editor, or set v_course_override to a published course UUID.';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM courses WHERE id = v_course_id AND is_published = true) THEN
    RAISE EXCEPTION 'Course not found or not published: %', v_course_id;
  END IF;

  RAISE NOTICE 'Using course id: %', v_course_id;

  SELECT COALESCE(MAX(sort_order), -1) + 1 INTO v_next_sort FROM lessons WHERE course_id = v_course_id;

  INSERT INTO lessons (course_id, sort_order, title, lesson_type, duration_minutes, body_markdown)
  VALUES (
    v_course_id,
    v_next_sort,
    'Sample knowledge check',
    'quiz',
    10,
    'This is intro text (optional). Answer each question below — grading is still stubbed in the app.'
  )
  RETURNING id INTO v_lesson_id;

  INSERT INTO lesson_quiz_questions (lesson_id, sort_order, prompt, explanation)
  VALUES (v_lesson_id, 0, 'What is 2 + 2?', 'Four.')
  RETURNING id INTO v_q1;

  INSERT INTO lesson_quiz_options (question_id, sort_order, label, is_correct) VALUES
    (v_q1, 0, '3', false),
    (v_q1, 1, '4', true),
    (v_q1, 2, '22', false);

  INSERT INTO lesson_quiz_questions (lesson_id, sort_order, prompt, explanation)
  VALUES (v_lesson_id, 1, 'Which HTTP method is usually used to fetch a resource?', 'GET is for reads.')
  RETURNING id INTO v_q2;

  INSERT INTO lesson_quiz_options (question_id, sort_order, label, is_correct) VALUES
    (v_q2, 0, 'GET', true),
    (v_q2, 1, 'POST', false),
    (v_q2, 2, 'DELETE', false);

  RAISE NOTICE 'Created quiz lesson id: %', v_lesson_id;
  RAISE NOTICE 'Open: /trainee/courses/%/lessons/%', v_course_id, v_lesson_id;
END $$;
