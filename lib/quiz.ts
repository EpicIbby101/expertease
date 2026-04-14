import { createClient, SupabaseClient } from '@supabase/supabase-js';

function getSupabase(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/** Shapes safe to send to the client (no correct-answer flags). */
export type TraineeQuizOptionPublic = {
  id: string;
  label: string;
  sortOrder: number;
};

export type TraineeQuizQuestionPublic = {
  id: string;
  prompt: string;
  sortOrder: number;
  options: TraineeQuizOptionPublic[];
};

/**
 * Load quiz content for a lesson. Returns [] if not a quiz or on error.
 * TODO: enforce published course + trainee access if you call this outside lesson context.
 */
export async function getTraineeQuizQuestionsForLesson(
  lessonId: string
): Promise<TraineeQuizQuestionPublic[]> {
  const supabase = getSupabase();

  const { data: lesson, error: lessonErr } = await supabase
    .from('lessons')
    .select('id, lesson_type')
    .eq('id', lessonId)
    .maybeSingle();

  if (lessonErr || !lesson || lesson.lesson_type !== 'quiz') {
    return [];
  }

  const { data: questions, error: qErr } = await supabase
    .from('lesson_quiz_questions')
    .select('id, sort_order, prompt')
    .eq('lesson_id', lessonId)
    .order('sort_order', { ascending: true });

  if (qErr || !questions?.length) {
    if (qErr) console.error('getTraineeQuizQuestionsForLesson questions:', qErr);
    return [];
  }

  const qIds = questions.map((q) => q.id);
  const { data: options, error: oErr } = await supabase
    .from('lesson_quiz_options')
    .select('id, question_id, sort_order, label')
    .in('question_id', qIds)
    .order('sort_order', { ascending: true });

  if (oErr) {
    console.error('getTraineeQuizQuestionsForLesson options:', oErr);
    return [];
  }

  const byQuestion = new Map<string, TraineeQuizOptionPublic[]>();
  for (const row of options ?? []) {
    const list = byQuestion.get(row.question_id) ?? [];
    list.push({
      id: row.id,
      label: row.label,
      sortOrder: row.sort_order,
    });
    byQuestion.set(row.question_id, list);
  }

  return questions.map((q) => ({
    id: q.id,
    prompt: q.prompt,
    sortOrder: q.sort_order,
    options: byQuestion.get(q.id) ?? [],
  }));
}
