import { createClient, SupabaseClient } from '@supabase/supabase-js';

function getSupabase(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export type TraineeLessonType = 'video' | 'reading' | 'quiz' | 'assignment' | 'download';

export type TraineeCourseStatus = 'available' | 'enrolled' | 'completed' | 'in_progress';

export interface TraineeCatalogCourse {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number;
  lessons: number;
  enrolledCount: number;
  rating: number;
  status: TraineeCourseStatus;
  progress?: number;
  enrolledDate?: string;
}

export interface TraineeLesson {
  id: string;
  title: string;
  type: TraineeLessonType;
  duration: number;
  completed: boolean;
  order: number;
  bodyMarkdown: string | null;
  resourceBucket: string | null;
  resourcePath: string | null;
}

export interface TraineeCourseDetail {
  id: string;
  slug: string;
  title: string;
  description: string;
  fullDescription: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number;
  lessons: TraineeLesson[];
  enrolledCount: number;
  rating: number;
  instructor: string;
  objectives: string[];
  prerequisites: string[];
  status: TraineeCourseStatus;
  progress?: number;
  enrolledDate?: string;
  completedDate?: string;
}

function normalizeDifficulty(
  value: string | null | undefined
): 'beginner' | 'intermediate' | 'advanced' {
  if (value === 'intermediate' || value === 'advanced' || value === 'beginner') return value;
  return 'beginner';
}

function mapLessonType(dbType: string | null | undefined): TraineeLessonType {
  switch (dbType) {
    case 'video':
    case 'reading':
    case 'quiz':
    case 'assignment':
    case 'download':
      return dbType;
    default:
      return 'reading';
  }
}

function courseStatusFromProgress(
  completedCount: number,
  totalLessons: number
): TraineeCourseStatus {
  if (totalLessons === 0) return 'available';
  if (completedCount === 0) return 'enrolled';
  if (completedCount >= totalLessons) return 'completed';
  return 'in_progress';
}

export async function getPublishedCoursesForCatalog(userId: string): Promise<TraineeCatalogCourse[]> {
  const supabase = getSupabase();

  const { data: courses, error } = await supabase
    .from('courses')
    .select(
      `
      id,
      title,
      description,
      category,
      difficulty,
      duration_hours,
      lessons ( id )
    `
    )
    .eq('is_published', true)
    .order('title');

  if (error || !courses?.length) {
    if (error) console.error('getPublishedCoursesForCatalog:', error);
    return [];
  }

  const allLessonIds = courses.flatMap((c) => (c.lessons as { id: string }[] | null)?.map((l) => l.id) ?? []);

  let progressRows: { lesson_id: string; completed: boolean }[] = [];
  if (allLessonIds.length > 0) {
    const { data: prog } = await supabase
      .from('lesson_progress')
      .select('lesson_id, completed')
      .eq('user_id', userId)
      .in('lesson_id', allLessonIds);
    progressRows = prog ?? [];
  }

  const completedByLesson = new Map<string, boolean>();
  for (const row of progressRows) {
    if (row.completed) completedByLesson.set(row.lesson_id, true);
  }

  return courses.map((row) => {
    const lessonRows = (row.lessons as { id: string }[] | null) ?? [];
    const total = lessonRows.length;
    const completed = lessonRows.filter((l) => completedByLesson.get(l.id)).length;
    const status = courseStatusFromProgress(completed, total);
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      id: row.id,
      title: row.title,
      description: row.description ?? '',
      category: row.category ?? 'General',
      difficulty: normalizeDifficulty(row.difficulty),
      duration: row.duration_hours != null ? Number(row.duration_hours) : 0,
      lessons: total,
      enrolledCount: 0,
      rating: 0,
      status,
      progress: total > 0 ? progress : undefined,
      enrolledDate: status !== 'available' ? undefined : undefined,
    };
  });
}

export async function getTraineeCourseDetail(
  courseIdOrSlug: string,
  userId: string
): Promise<TraineeCourseDetail | null> {
  const supabase = getSupabase();

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    courseIdOrSlug
  );

  let query = supabase.from('courses').select('*').eq('is_published', true);
  query = isUuid ? query.eq('id', courseIdOrSlug) : query.eq('slug', courseIdOrSlug);

  const { data: course, error } = await query.single();

  if (error || !course) {
    if (error) console.error('getTraineeCourseDetail course:', error);
    return null;
  }

  const { data: lessonRows, error: lessonsError } = await supabase
    .from('lessons')
    .select(
      'id, sort_order, title, lesson_type, duration_minutes, body_markdown, resource_path, resource_bucket'
    )
    .eq('course_id', course.id)
    .order('sort_order', { ascending: true });

  if (lessonsError) {
    console.error('getTraineeCourseDetail lessons:', lessonsError);
    return null;
  }

  const lessonsList = lessonRows ?? [];
  const lessonIds = lessonsList.map((l) => l.id);

  let progressRows: { lesson_id: string; completed: boolean; completed_at: string | null }[] = [];
  if (lessonIds.length > 0) {
    const { data: prog } = await supabase
      .from('lesson_progress')
      .select('lesson_id, completed, completed_at')
      .eq('user_id', userId)
      .in('lesson_id', lessonIds);
    progressRows = prog ?? [];
  }

  const progressByLesson = new Map(progressRows.map((p) => [p.lesson_id, p]));

  const lessons: TraineeLesson[] = lessonsList.map((l) => {
    const p = progressByLesson.get(l.id);
    return {
      id: l.id,
      title: l.title,
      type: mapLessonType(l.lesson_type),
      duration: l.duration_minutes ?? 0,
      completed: Boolean(p?.completed),
      order: l.sort_order,
      bodyMarkdown: l.body_markdown,
      resourceBucket: l.resource_bucket,
      resourcePath: l.resource_path,
    };
  });

  const total = lessons.length;
  const completed = lessons.filter((l) => l.completed).length;
  const status = courseStatusFromProgress(completed, total);
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  const completedTimestamps = progressRows
    .filter((p) => p.completed && p.completed_at)
    .map((p) => new Date(p.completed_at!).getTime());
  const completedDate =
    status === 'completed' && completedTimestamps.length > 0
      ? new Date(Math.max(...completedTimestamps)).toISOString()
      : undefined;

  return {
    id: course.id,
    slug: course.slug,
    title: course.title,
    description: course.description ?? '',
    fullDescription: course.full_description ?? course.description ?? '',
    category: course.category ?? 'General',
    difficulty: normalizeDifficulty(course.difficulty),
    duration: course.duration_hours != null ? Number(course.duration_hours) : 0,
    lessons,
    enrolledCount: 0,
    rating: 0,
    instructor: 'Expert Ease',
    objectives: [],
    prerequisites: [],
    status,
    progress: total > 0 ? progress : undefined,
    completedDate,
  };
}

export async function getTraineeLessonForCourse(
  courseIdOrSlug: string,
  lessonId: string,
  userId: string
): Promise<{
  course: { id: string; title: string; slug: string };
  lesson: TraineeLesson;
  signedResourceUrl: string | null;
} | null> {
  const detail = await getTraineeCourseDetail(courseIdOrSlug, userId);
  if (!detail) return null;

  const lesson = detail.lessons.find((l) => l.id === lessonId);
  if (!lesson) return null;

  let signedResourceUrl: string | null = null;
  if (lesson.resourceBucket && lesson.resourcePath) {
    const supabase = getSupabase();
    const { data, error } = await supabase.storage
      .from(lesson.resourceBucket)
      .createSignedUrl(lesson.resourcePath, 3600);

    if (error) {
      console.error('getTraineeLessonForCourse signed URL:', error);
    } else {
      signedResourceUrl = data?.signedUrl ?? null;
    }
  }

  return {
    course: { id: detail.id, title: detail.title, slug: detail.slug },
    lesson,
    signedResourceUrl,
  };
}
