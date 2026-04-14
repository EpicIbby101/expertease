import { NextResponse } from 'next/server';
import { getAuthForApi, hasRole } from '@/lib/auth';

/**
 * Skeleton: authenticate trainee, then return 501.
 * TODO: load correct flags from `lesson_quiz_options`, score, write `lesson_quiz_attempts`,
 * upsert `lesson_progress` when passed, return per-question feedback.
 */
export async function POST() {
  const { userId } = await getAuthForApi();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!(await hasRole('trainee'))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json(
    { error: 'Quiz grading not implemented yet', code: 'NOT_IMPLEMENTED' },
    { status: 501 }
  );
}
