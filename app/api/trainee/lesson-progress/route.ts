import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthForApi, hasRole } from '@/lib/auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  const { userId } = await getAuthForApi();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!(await hasRole('trainee'))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: { lessonId?: string; completed?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { lessonId, completed } = body;
  if (!lessonId || typeof completed !== 'boolean') {
    return NextResponse.json({ error: 'lessonId and completed required' }, { status: 400 });
  }

  const { data: lesson, error: lessonErr } = await supabase
    .from('lessons')
    .select('id, course_id')
    .eq('id', lessonId)
    .single();

  if (lessonErr || !lesson) {
    return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
  }

  const { data: course, error: courseErr } = await supabase
    .from('courses')
    .select('is_published')
    .eq('id', lesson.course_id)
    .single();

  if (courseErr || !course?.is_published) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const completedAt = completed ? new Date().toISOString() : null;

  const { error: upsertErr } = await supabase.from('lesson_progress').upsert(
    {
      user_id: userId,
      lesson_id: lessonId,
      completed,
      completed_at: completedAt,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,lesson_id' }
  );

  if (upsertErr) {
    console.error('lesson_progress upsert:', upsertErr);
    return NextResponse.json({ error: 'Failed to save progress' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
