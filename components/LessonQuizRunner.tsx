'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileQuestion, Loader2 } from 'lucide-react';
import type { TraineeQuizQuestionPublic } from '@/lib/quiz';

interface LessonQuizRunnerProps {
  lessonId: string;
  questions: TraineeQuizQuestionPublic[];
}

export function LessonQuizRunner({ lessonId, questions }: LessonQuizRunnerProps) {
  const [pending, setPending] = useState(false);
  const [lastMessage, setLastMessage] = useState<string | null>(null);

  async function onSubmitSkeleton() {
    setPending(true);
    setLastMessage(null);
    try {
      const res = await fetch('/api/trainee/quiz-submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId, answers: {} }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (res.status === 501) {
        setLastMessage(data.error ?? 'Grading API is still a stub.');
      } else {
        setLastMessage(data.error ?? `Unexpected response (${res.status})`);
      }
    } catch {
      setLastMessage('Request failed.');
    } finally {
      setPending(false);
    }
  }

  if (questions.length === 0) {
    return (
      <Card className="border-2 border-violet-200 bg-gradient-to-br from-violet-50/80 to-white">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500 shadow-sm">
              <FileQuestion className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl text-gray-800">Quiz</CardTitle>
              <CardDescription>
                No questions in the database for this lesson yet. Add rows to{' '}
                <code className="text-xs">lesson_quiz_questions</code> /{' '}
                <code className="text-xs">lesson_quiz_options</code>.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-violet-200 bg-gradient-to-br from-violet-50/80 to-white">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500 shadow-sm">
            <FileQuestion className="h-5 w-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-xl text-gray-800">Quiz (skeleton)</CardTitle>
            <CardDescription>
              UI placeholder — wire selection state, then replace stub response in{' '}
              <code className="text-xs">/api/trainee/quiz-submit</code>.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {questions.map((q, i) => (
          <div key={q.id} className="rounded-lg border border-violet-100 bg-white/80 p-4">
            <p className="text-sm font-medium text-gray-900">
              {i + 1}. {q.prompt}
            </p>
            {q.options.length > 0 ? (
              <ul className="mt-2 space-y-1 text-sm text-gray-700">
                {q.options.map((o) => (
                  <li key={o.id} className="pl-2">
                    — {o.label}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-xs text-amber-700">No options for this question.</p>
            )}
          </div>
        ))}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button type="button" disabled={pending} onClick={onSubmitSkeleton} variant="secondary">
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Test stub submit'}
          </Button>
          {lastMessage ? <p className="text-sm text-gray-600">{lastMessage}</p> : null}
        </div>
      </CardContent>
    </Card>
  );
}
