'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CheckCircle, ChevronRight, Loader2 } from 'lucide-react';

interface MarkLessonCompleteButtonProps {
  lessonId: string;
  initialCompleted: boolean;
  courseId: string;
  nextLesson: { id: string; title: string } | null;
}

export function MarkLessonCompleteButton({
  lessonId,
  initialCompleted,
  courseId,
  nextLesson,
}: MarkLessonCompleteButtonProps) {
  const router = useRouter();
  const [completed, setCompleted] = useState(initialCompleted);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setCompleted(initialCompleted);
  }, [initialCompleted, lessonId]);

  async function setProgress(next: boolean) {
    setPending(true);
    try {
      const res = await fetch('/api/trainee/lesson-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId, completed: next }),
      });
      if (!res.ok) throw new Error(await res.text());
      setCompleted(next);
      router.refresh();
    } catch (e) {
      console.error(e);
    } finally {
      setPending(false);
    }
  }

  if (completed) {
    return (
      <div className="flex flex-col items-stretch gap-2 sm:items-end w-full sm:w-auto min-w-0">
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button variant="outline" size="sm" disabled={pending} onClick={() => setProgress(false)}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Mark incomplete'}
          </Button>
          <span className="text-sm text-green-600 flex items-center gap-1">
            <CheckCircle className="h-4 w-4 shrink-0" />
            Completed
          </span>
        </div>
        {nextLesson ? (
          <Button asChild size="sm" className="max-w-full">
            <Link
              href={`/trainee/courses/${courseId}/lessons/${nextLesson.id}`}
              className="inline-flex max-w-full items-center gap-1"
            >
              <span className="truncate">Next: {nextLesson.title}</span>
              <ChevronRight className="h-4 w-4 shrink-0" />
            </Link>
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-stretch gap-2 sm:items-end">
      <Button size="sm" disabled={pending} onClick={() => setProgress(true)}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        Mark complete
      </Button>
      {nextLesson ? (
        <p className="text-xs text-gray-500 text-right max-w-[16rem]">
          Mark complete when you&apos;re done to unlock the next lesson.
        </p>
      ) : null}
    </div>
  );
}
