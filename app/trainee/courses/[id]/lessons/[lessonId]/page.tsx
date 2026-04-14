import { RoleGate } from '@/components/RoleGate';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MarkLessonCompleteButton } from '@/components/MarkLessonCompleteButton';
import { getTraineeLessonForCourse } from '@/lib/courses';
import { auth } from '@clerk/nextjs/server';
import Link from 'next/link';
import { ArrowLeft, ExternalLink } from 'lucide-react';
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

  const { course, lesson, signedResourceUrl } = data;
  const isPdf =
    lesson.resourcePath?.toLowerCase().endsWith('.pdf') ?? false;

  return (
    <RoleGate requiredRole="trainee">
      <div className="space-y-6 max-w-5xl mx-auto">
        <Button asChild variant="ghost" className="mb-2 -ml-2">
          <Link href={`/trainee/courses/${course.id}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to {course.title}
          </Link>
        </Button>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <p className="text-sm text-gray-500 mb-1">{course.title}</p>
            <h1 className="text-2xl font-bold text-gray-900">{lesson.title}</h1>
          </div>
          <MarkLessonCompleteButton lessonId={lesson.id} initialCompleted={lesson.completed} />
        </div>

        {lesson.bodyMarkdown ? (
          <Card>
            <CardHeader>
              <CardTitle>Reading</CardTitle>
            </CardHeader>
            <CardContent>
              <article className="prose prose-gray max-w-none">
                <p className="whitespace-pre-wrap text-gray-800">{lesson.bodyMarkdown}</p>
              </article>
            </CardContent>
          </Card>
        ) : null}

        {signedResourceUrl ? (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <CardTitle>Materials</CardTitle>
              <Button asChild variant="outline" size="sm">
                <a href={signedResourceUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open in new tab
                </a>
              </Button>
            </CardHeader>
            <CardContent className="p-0 sm:p-6">
              {isPdf ? (
                <iframe
                  title={lesson.title}
                  src={signedResourceUrl}
                  className="w-full min-h-[75vh] rounded-b-lg sm:rounded-lg border border-gray-200 bg-gray-50"
                />
              ) : (
                <p className="text-sm text-gray-600 px-6 pb-6">
                  Use &quot;Open in new tab&quot; to view or download this file.
                </p>
              )}
            </CardContent>
          </Card>
        ) : (
          !lesson.bodyMarkdown && (
            <p className="text-gray-600 text-sm">No content is linked to this lesson yet.</p>
          )
        )}
      </div>
    </RoleGate>
  );
}
