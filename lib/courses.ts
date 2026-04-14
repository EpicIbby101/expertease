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

function trimOrNull(value: string | null | undefined): string | null {
  if (value == null) return null;
  const t = value.trim();
  return t.length > 0 ? t : null;
}

/** Same slug twice should be impossible with UNIQUE(slug); still dedupe defensively (oldest wins). */
function dedupeCoursesBySlug<T extends { slug: string; created_at?: string }>(rows: readonly T[]): T[] {
  const sorted = [...rows].sort(
    (a, b) => new Date(a.created_at ?? 0).getTime() - new Date(b.created_at ?? 0).getTime()
  );
  const seen = new Set<string>();
  const out: T[] = [];
  for (const row of sorted) {
    const key = row.slug.trim().toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(row);
  }
  return out;
}

/**
 * Running the seed script twice often creates a second course with a new slug but the same title
 * and the same number of lessons — show only the oldest of those.
 */
function dedupeCoursesByTitleAndLessonCount<T extends { title: string; created_at?: string; lessons: unknown }>(
  rows: readonly T[]
): T[] {
  const sorted = [...rows].sort(
    (a, b) => new Date(a.created_at ?? 0).getTime() - new Date(b.created_at ?? 0).getTime()
  );
  const seen = new Set<string>();
  const out: T[] = [];
  for (const row of sorted) {
    const n = (row.lessons as { id: string }[] | null)?.length ?? 0;
    const key = `${row.title.trim().toLowerCase()}::${n}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(row);
  }
  return out;
}

export type DashboardCourseListStatus = 'completed' | 'in_progress' | 'not_started';

export interface TraineeDashboardCourseProgress {
  courseId: string;
  courseName: string;
  progress: number;
  status: DashboardCourseListStatus;
  enrolledDate: string | null;
  completedDate: string | null;
}

export interface TraineeDashboardLearning {
  enrolledCourses: number;
  completedCourses: number;
  inProgressCourses: number;
  /** Portion of all lessons across published courses marked complete (0–100). */
  lessonCompletionRate: number;
  lessonsCompleted: number;
  lessonsTotal: number;
  /** Share of published courses (with lessons) fully completed (0–100). */
  overallCourseCompletionRate: number;
  engagementScore: number;
  courseProgress: TraineeDashboardCourseProgress[];
}

function dashboardStatusFromCounts(
  completedLessonCount: number,
  totalLessons: number
): DashboardCourseListStatus {
  if (totalLessons === 0) return 'not_started';
  if (completedLessonCount >= totalLessons) return 'completed';
  if (completedLessonCount === 0) return 'not_started';
  return 'in_progress';
}

function engagementScoreFromRecency(
  lastUserActive: string | null | undefined,
  lastLessonActivity: string | null
): number {
  const times: number[] = [];
  if (lastUserActive) times.push(new Date(lastUserActive).getTime());
  if (lastLessonActivity) times.push(new Date(lastLessonActivity).getTime());
  const mostRecent = times.length > 0 ? Math.max(...times) : 0;
  if (!mostRecent || Number.isNaN(mostRecent)) return 35;
  const days = (Date.now() - mostRecent) / 86400000;
  if (days <= 1) return 92;
  if (days <= 3) return 85;
  if (days <= 7) return 72;
  if (days <= 14) return 58;
  if (days <= 30) return 42;
  return 28;
}

/** Dashboard + home widgets: real counts from `courses`, `lessons`, `lesson_progress`. */
export async function getTraineeDashboardLearning(userId: string): Promise<TraineeDashboardLearning> {
  const supabase = getSupabase();

  const { data: rawCourses, error } = await supabase
    .from('courses')
    .select(
      `
      id,
      slug,
      created_at,
      title,
      lessons ( id )
    `
    )
    .eq('is_published', true)
    .order('title');

  if (error) {
    console.error('getTraineeDashboardLearning courses:', error);
    return {
      enrolledCourses: 0,
      completedCourses: 0,
      inProgressCourses: 0,
      lessonCompletionRate: 0,
      lessonsCompleted: 0,
      lessonsTotal: 0,
      overallCourseCompletionRate: 0,
      engagementScore: 35,
      courseProgress: [],
    };
  }

  const raw = rawCourses ?? [];
  if (raw.length === 0) {
    return {
      enrolledCourses: 0,
      completedCourses: 0,
      inProgressCourses: 0,
      lessonCompletionRate: 0,
      lessonsCompleted: 0,
      lessonsTotal: 0,
      overallCourseCompletionRate: 0,
      engagementScore: 35,
      courseProgress: [],
    };
  }

  const courses = dedupeCoursesByTitleAndLessonCount(dedupeCoursesBySlug(raw));

  const lessonToCourse = new Map<string, string>();
  const allLessonIds: string[] = [];
  for (const c of courses) {
    const lid = (c.lessons as { id: string }[] | null) ?? [];
    for (const l of lid) {
      lessonToCourse.set(l.id, c.id);
      allLessonIds.push(l.id);
    }
  }

  let progressRows: {
    lesson_id: string;
    completed: boolean;
    completed_at: string | null;
    updated_at: string | null;
  }[] = [];

  if (allLessonIds.length > 0) {
    const { data: prog, error: progErr } = await supabase
      .from('lesson_progress')
      .select('lesson_id, completed, completed_at, updated_at')
      .eq('user_id', userId)
      .in('lesson_id', allLessonIds);
    if (progErr) console.error('getTraineeDashboardLearning progress:', progErr);
    progressRows = prog ?? [];
  }

  const byLesson = new Map<string, { completed: boolean; completed_at: string | null; updated_at: string | null }>();
  for (const row of progressRows) {
    byLesson.set(row.lesson_id, {
      completed: row.completed,
      completed_at: row.completed_at,
      updated_at: row.updated_at,
    });
  }

  let lessonsTotal = 0;
  let lessonsCompleted = 0;
  const courseProgress: TraineeDashboardCourseProgress[] = [];

  let withLessons = 0;
  let completedCourses = 0;
  let inProgressCourses = 0;

  let maxLessonActivity: string | null = null;

  for (const row of courses) {
    const lessonRows = (row.lessons as { id: string }[] | null) ?? [];
    const total = lessonRows.length;
    lessonsTotal += total;

    let done = 0;
    const completedAts: number[] = [];
    const activityTimes: number[] = [];

    for (const l of lessonRows) {
      const p = byLesson.get(l.id);
      if (p?.updated_at) {
        const t = new Date(p.updated_at).getTime();
        if (!Number.isNaN(t)) {
          activityTimes.push(t);
          if (!maxLessonActivity || t > new Date(maxLessonActivity).getTime()) {
            maxLessonActivity = p.updated_at;
          }
        }
      }
      if (p?.completed) {
        done += 1;
        lessonsCompleted += 1;
        if (p.completed_at) {
          const ct = new Date(p.completed_at).getTime();
          if (!Number.isNaN(ct)) completedAts.push(ct);
        }
      }
    }

    if (total === 0) continue;
    withLessons += 1;

    const progress = Math.round((done / total) * 100);
    const status = dashboardStatusFromCounts(done, total);
    if (status === 'completed') completedCourses += 1;
    else if (status === 'in_progress') inProgressCourses += 1;

    const firstActivity =
      activityTimes.length > 0
        ? new Date(Math.min(...activityTimes)).toISOString()
        : null;
    const completedDate =
      status === 'completed' && completedAts.length > 0
        ? new Date(Math.max(...completedAts)).toISOString()
        : null;

    courseProgress.push({
      courseId: row.id,
      courseName: row.title,
      progress,
      status,
      enrolledDate: firstActivity ?? (row.created_at as string | undefined) ?? null,
      completedDate,
    });
  }

  courseProgress.sort((a, b) => a.courseName.localeCompare(b.courseName));

  const lessonCompletionRate =
    lessonsTotal > 0 ? Math.round((lessonsCompleted / lessonsTotal) * 100 * 10) / 10 : 0;
  const overallCourseCompletionRate =
    withLessons > 0 ? Math.round((completedCourses / withLessons) * 100 * 10) / 10 : 0;

  const { data: userRow } = await supabase
    .from('users')
    .select('last_active_at')
    .eq('user_id', userId)
    .maybeSingle();

  const engagementScore = engagementScoreFromRecency(userRow?.last_active_at ?? null, maxLessonActivity);

  return {
    enrolledCourses: withLessons,
    completedCourses,
    inProgressCourses,
    lessonCompletionRate,
    lessonsCompleted,
    lessonsTotal,
    overallCourseCompletionRate,
    engagementScore,
    courseProgress,
  };
}

export async function getPublishedCoursesForCatalog(userId: string): Promise<TraineeCatalogCourse[]> {
  const supabase = getSupabase();

  const { data: rawCourses, error } = await supabase
    .from('courses')
    .select(
      `
      id,
      slug,
      created_at,
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

  if (error || !rawCourses?.length) {
    if (error) console.error('getPublishedCoursesForCatalog:', error);
    return [];
  }

  const slugDeduped = dedupeCoursesBySlug(rawCourses);
  const courses = dedupeCoursesByTitleAndLessonCount(slugDeduped);

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

  let course: Record<string, unknown> | null = null;
  let courseError: Error | null = null;

  if (isUuid) {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('is_published', true)
      .eq('id', courseIdOrSlug)
      .single();
    course = data as Record<string, unknown> | null;
    courseError = error as Error | null;
  } else {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('is_published', true)
      .eq('slug', courseIdOrSlug)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();
    course = data as Record<string, unknown> | null;
    courseError = error as Error | null;
  }

  if (courseError || !course) {
    if (courseError) console.error('getTraineeCourseDetail course:', courseError);
    return null;
  }

  const c = course as {
    id: string;
    slug: string;
    title: string;
    description: string | null;
    full_description: string | null;
    category: string | null;
    difficulty: string | null;
    duration_hours: number | string | null;
  };

  const { data: lessonRows, error: lessonsError } = await supabase
    .from('lessons')
    .select(
      'id, sort_order, title, lesson_type, duration_minutes, body_markdown, resource_path, resource_bucket'
    )
    .eq('course_id', c.id)
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
      bodyMarkdown: trimOrNull(l.body_markdown),
      resourceBucket: trimOrNull(l.resource_bucket),
      resourcePath: trimOrNull(l.resource_path),
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
    id: c.id,
    slug: c.slug,
    title: c.title,
    description: c.description ?? '',
    fullDescription: c.full_description ?? c.description ?? '',
    category: c.category ?? 'General',
    difficulty: normalizeDifficulty(c.difficulty),
    duration: c.duration_hours != null ? Number(c.duration_hours) : 0,
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
  resourceSignError: string | null;
  nextLesson: { id: string; title: string } | null;
} | null> {
  const detail = await getTraineeCourseDetail(courseIdOrSlug, userId);
  if (!detail) return null;

  const ordered = detail.lessons;
  const idx = ordered.findIndex((l) => l.id === lessonId);
  const nextLesson =
    idx >= 0 && idx < ordered.length - 1
      ? { id: ordered[idx + 1]!.id, title: ordered[idx + 1]!.title }
      : null;

  const lesson = ordered[idx];
  if (!lesson) return null;

  let signedResourceUrl: string | null = null;
  let resourceSignError: string | null = null;

  const bucket = lesson.resourceBucket;
  const path = lesson.resourcePath;

  if (bucket && path) {
    const supabase = getSupabase();
    const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 3600);

    if (error) {
      console.error('getTraineeLessonForCourse signed URL:', error);
      resourceSignError = error.message ?? 'Could not create signed URL for this file.';
    } else {
      signedResourceUrl = data?.signedUrl ?? null;
    }
  }

  return {
    course: { id: detail.id, title: detail.title, slug: detail.slug },
    lesson,
    signedResourceUrl,
    resourceSignError,
    nextLesson,
  };
}
