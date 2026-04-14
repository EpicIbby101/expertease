'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2 } from 'lucide-react';

interface MarkLessonCompleteButtonProps {
  lessonId: string;
  initialCompleted: boolean;
}

export function MarkLessonCompleteButton({
  lessonId,
  initialCompleted,
}: MarkLessonCompleteButtonProps) {
  const router = useRouter();
  const [completed, setCompleted] = useState(initialCompleted);
  const [pending, setPending] = useState(false);

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
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" disabled={pending} onClick={() => setProgress(false)}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Mark incomplete'}
        </Button>
        <span className="text-sm text-green-600 flex items-center gap-1">
          <CheckCircle className="h-4 w-4" />
          Completed
        </span>
      </div>
    );
  }

  return (
    <Button size="sm" disabled={pending} onClick={() => setProgress(true)}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
      Mark complete
    </Button>
  );
}
