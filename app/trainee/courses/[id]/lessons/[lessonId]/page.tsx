import { RoleGate } from '@/components/RoleGate';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MarkLessonCompleteButton } from '@/components/MarkLessonCompleteButton';
import { getTraineeLessonForCourse } from '@/lib/courses';
import { getTraineeQuizQuestionsForLesson } from '@/lib/quiz';
import { LessonQuizRunner } from '@/components/LessonQuizRunner';
import { auth } from '@clerk/nextjs/server';
import Link from 'next/link';
import {
  ArrowLeft,
  BookOpen,
  ChevronRight,
  ExternalLink,
  FileText,
  ListOrdered,
  Sparkles,
  GraduationCap,
} from 'lucide-react';

const HERO_PATTERN =
  "bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIzMCIvPjwvZz48L2c+PC9zdmc+')]";
import { notFound } from 'next/navigation';

export default async function TraineeLessonPage({
  params,
}: {
  params: Promise<{ id: string; lessonId: string }>;
}) {
  const { userId } = await auth();
  if (!userId) return null;

  const { id: courseParam, lessonId } = await params;
  const data = await getTraineeLessonForCourse(courseParam, lessonId, userId);

  if (!data) {
    notFound();
  }

  const { course, lesson, signedResourceUrl, resourceSignError, nextLesson, courseFullyCompleted } = data;
  const quizQuestions =
    lesson.type === 'quiz' ? await getTraineeQuizQuestionsForLesson(lesson.id) : [];
  const isPdf =
    lesson.resourcePath?.toLowerCase().endsWith('.pdf') ?? false;
  const hasFilePointer = Boolean(lesson.resourceBucket && lesson.resourcePath);

  return (
    <RoleGate requiredRole="trainee">
      <div className="mx-auto max-w-5xl space-y-6">
        <Card className="border-2 border-purple-100 bg-gradient-to-r from-white to-purple-50/40 shadow-sm">
          <CardContent className="p-4 sm:p-5">
            <nav
              className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between"
              aria-label="Lesson navigation"
            >
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="-ml-2 text-purple-800 hover:bg-purple-100/80"
                >
                  <Link href={`/trainee/courses/${course.id}#lessons`}>
                    <ListOrdered className="mr-2 h-4 w-4 shrink-0" />
                    Back to all lessons
                  </Link>
                </Button>
                <span className="hidden select-none text-purple-200 sm:inline" aria-hidden>
                  ·
                </span>
                <Button asChild variant="ghost" size="sm" className="text-indigo-700 hover:bg-indigo-50">
                  <Link href="/trainee/courses">
                    <BookOpen className="mr-2 h-4 w-4 shrink-0" />
                    All courses
                  </Link>
                </Button>
              </div>
              <Link
                href={`/trainee/courses/${course.id}`}
                className="inline-flex w-fit items-center gap-1 text-sm font-medium text-gray-600 hover:text-purple-800"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Course overview
              </Link>
            </nav>
          </CardContent>
        </Card>

        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 p-5 shadow-lg sm:p-7">
          <div className={`absolute inset-0 ${HERO_PATTERN} opacity-20`} />
          <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 flex-1 items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/20 shadow-md backdrop-blur-sm">
                <GraduationCap className="h-7 w-7 text-white" />
              </div>
              <div className="min-w-0">
                <p className="mb-1 text-sm font-medium text-white/90">
                  <Link href={`/trainee/courses/${course.id}`} className="hover:underline">
                    {course.title}
                  </Link>
                </p>
                <h1 className="text-2xl font-bold leading-tight text-white drop-shadow-sm sm:text-3xl">
                  {lesson.title}
                </h1>
                <p className="mt-2 flex items-center gap-1.5 text-sm text-white/85">
                  <Sparkles className="h-4 w-4 shrink-0" />
                  Take your time — you&apos;ve got this!
                </p>
              </div>
            </div>
            <div className="w-full shrink-0 rounded-xl border border-white/40 bg-white/95 p-3 shadow-lg backdrop-blur-sm sm:w-auto sm:pt-0">
          <MarkLessonCompleteButton
            lessonId={lesson.id}
            initialCompleted={lesson.completed}
            courseId={course.id}
            nextLesson={nextLesson}
          />
            </div>
          </div>
        </div>

        {lesson.type === 'quiz' ? (
          <LessonQuizRunner lessonId={lesson.id} questions={quizQuestions} />
        ) : null}

        {lesson.bodyMarkdown ? (
          <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50/80 to-white">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500 shadow-sm">
                  <BookOpen className="h-5 w-5 text-white" />
                </div>
                <CardTitle className="text-xl text-gray-800">Reading 📄</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <article className="prose prose-gray max-w-none">
                <p className="whitespace-pre-wrap text-gray-800">{lesson.bodyMarkdown}</p>
              </article>
            </CardContent>
          </Card>
        ) : null}

        {signedResourceUrl ? (
          <Card className="border-2 border-teal-200 bg-gradient-to-br from-teal-50/80 to-white">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-500 shadow-sm">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <CardTitle className="text-xl text-gray-800">Materials 📎</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                {isPdf
                  ? "For security, PDFs open in a new tab instead of inside this page. Use the buttons below — you can always come back here when you're done."
                  : 'Open the file in a new tab to view or download it.'}
              </p>
              <div className="flex flex-wrap gap-3">
                <Button
                  asChild
                  size="lg"
                  className="bg-gradient-to-r from-teal-500 to-cyan-600 font-semibold shadow-md hover:from-teal-600 hover:to-cyan-700"
                >
                  <a href={signedResourceUrl} target="_blank" rel="noopener noreferrer">
                    {isPdf ? (
                      <>
                        <FileText className="mr-2 h-4 w-4" />
                        Open PDF
                      </>
                    ) : (
                      <>
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Open file
                      </>
                    )}
                  </a>
                </Button>
                <Button asChild variant="outline" size="lg" className="border-2 border-teal-300 font-semibold">
                  <a href={signedResourceUrl} download rel="noopener noreferrer">
                    Download
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          !lesson.bodyMarkdown && (
            <div className="space-y-2 rounded-2xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50/50 p-4 text-sm text-amber-950">
              {!hasFilePointer ? (
                <p>
                  No file is linked to this lesson. In Supabase, set{' '}
                  <code className="rounded bg-amber-100 px-1">lessons.resource_bucket</code> and{' '}
                  <code className="rounded bg-amber-100 px-1">lessons.resource_path</code> to match
                  your Storage bucket and object key (check for typos and extra spaces).
                </p>
              ) : resourceSignError ? (
                <>
                  <p className="font-medium">Could not open the file from Storage.</p>
                  <p className="text-amber-900/90">{resourceSignError}</p>
                  <p className="text-xs text-amber-900/80">
                    Bucket: <code className="rounded bg-amber-100 px-1">{lesson.resourceBucket}</code>{' '}
                    · Path: <code className="rounded bg-amber-100 px-1 break-all">{lesson.resourcePath}</code>
                  </p>
                </>
              ) : (
                <p className="text-gray-700">No content is linked to this lesson yet.</p>
              )}
            </div>
          )
        )}

        {lesson.completed && nextLesson ? (
          <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 via-indigo-50/50 to-white shadow-md">
            <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-blue-900">Ready for the next step? 🎉</p>
                <p className="truncate text-gray-800" title={nextLesson.title}>
                  {nextLesson.title}
                </p>
              </div>
              <Button
                asChild
                size="lg"
                className="shrink-0 gap-1 bg-gradient-to-r from-blue-500 to-indigo-600 font-semibold shadow-md hover:from-blue-600 hover:to-indigo-700"
              >
                <Link href={`/trainee/courses/${course.id}/lessons/${nextLesson.id}`}>
                  Next lesson
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : lesson.completed && !nextLesson && courseFullyCompleted ? (
          <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50/50">
            <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-gray-800">
                You&apos;ve completed every lesson in this course — amazing work! 🏆 Review the curriculum or
                browse more courses anytime.
              </p>
              <Button
                asChild
                variant="outline"
                className="border-2 border-green-400 font-semibold text-green-900 hover:bg-green-100/80"
              >
                <Link href={`/trainee/courses/${course.id}#lessons`}>
                  <ListOrdered className="mr-2 h-4 w-4" />
                  Back to curriculum
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : lesson.completed && !nextLesson && !courseFullyCompleted ? (
          <Card className="border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50/40">
            <CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-gray-800">
                This is the last lesson in the list, but the course isn&apos;t finished until every lesson is
                marked complete. Check the curriculum for any still open.
              </p>
              <Button asChild variant="outline" className="border-2 border-amber-300 font-semibold">
                <Link href={`/trainee/courses/${course.id}#lessons`}>
                  <ListOrdered className="mr-2 h-4 w-4" />
                  View curriculum
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : null}

        <footer className="border-t border-gray-200 pt-4">
          <Link
            href={`/trainee/courses/${course.id}#lessons`}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-purple-700 hover:text-purple-900"
          >
            <ListOrdered className="h-4 w-4" />
            Back to all lessons
          </Link>
        </footer>
      </div>
    </RoleGate>
  );
}
