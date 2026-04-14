import { RoleGate } from '../../../../components/RoleGate';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import {
  BookOpen,
  Clock,
  Users,
  Star,
  CheckCircle,
  Play,
  ArrowLeft,
  Award,
  FileText,
  Video,
  FileQuestion,
  Target,
  Calendar,
  Download,
  Sparkles,
  GraduationCap,
  Library,
} from 'lucide-react';

const HERO_PATTERN =
  "bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIzMCIvPjwvZz48L2c+PC9zdmc+')]";
import { auth } from '@clerk/nextjs/server';
import { notFound } from 'next/navigation';
import { getTraineeCourseDetail, type TraineeCourseDetail, type TraineeLesson } from '@/lib/courses';

type Lesson = TraineeLesson;
type Course = TraineeCourseDetail;

function getLessonIcon(type: string) {
  switch (type) {
    case 'video':
      return <Video className="h-4 w-4" />;
    case 'reading':
      return <FileText className="h-4 w-4" />;
    case 'quiz':
      return <FileQuestion className="h-4 w-4" />;
    case 'assignment':
      return <Target className="h-4 w-4" />;
    case 'download':
      return <Download className="h-4 w-4" />;
    default:
      return <BookOpen className="h-4 w-4" />;
  }
}

function getLessonTypeLabel(type: string) {
  switch (type) {
    case 'video':
      return 'Video';
    case 'reading':
      return 'Reading';
    case 'quiz':
      return 'Quiz';
    case 'assignment':
      return 'Assignment';
    case 'download':
      return 'Download';
    default:
      return 'Lesson';
  }
}

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { userId } = await auth();
  
  if (!userId) {
    return null;
  }

  const { id } = await params;
  const course = await getTraineeCourseDetail(id, userId);

  if (!course) {
    notFound();
  }

  const completedLessons = course.lessons.filter(l => l.completed).length;
  const totalLessons = course.lessons.length;
  const currentLesson = course.lessons.find(l => !l.completed);
  const firstLesson = totalLessons > 0 ? course.lessons[0] : null;

  return (
    <RoleGate requiredRole="trainee">
      <div className="space-y-6">
        <Button
          asChild
          variant="outline"
          size="sm"
          className="mb-1 border-2 border-purple-200 bg-white font-medium text-purple-700 shadow-sm hover:bg-purple-50"
        >
          <Link href="/trainee/courses">
            <ArrowLeft className="mr-2 h-4 w-4" />
            All courses
          </Link>
        </Button>

        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 p-6 shadow-lg sm:p-8">
          <div className={`absolute inset-0 ${HERO_PATTERN} opacity-20`} />
          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 flex-1">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <Badge className="border-0 bg-white/25 text-white backdrop-blur-sm">
                  <Sparkles className="mr-1 h-3 w-3" />
                  Learning path
                </Badge>
                <Badge
                  variant="outline"
                  className={
                    course.difficulty === 'beginner'
                      ? 'border-green-200 bg-green-50 text-green-800'
                      : course.difficulty === 'intermediate'
                        ? 'border-blue-200 bg-blue-50 text-blue-800'
                        : 'border-purple-200 bg-purple-50 text-purple-800'
                  }
                >
                  {course.difficulty.charAt(0).toUpperCase() + course.difficulty.slice(1)}
                </Badge>
                <Badge variant="outline" className="border-white/40 bg-white/15 text-white">
                  {course.category}
                </Badge>
                {course.status === 'completed' && (
                  <Badge className="border-0 bg-emerald-500 text-white hover:bg-emerald-600">
                    <CheckCircle className="mr-1 h-3 w-3" />
                    Completed
                  </Badge>
                )}
                {course.status === 'in_progress' && (
                  <Badge className="border-0 bg-amber-500 text-white hover:bg-amber-600">
                    <Play className="mr-1 h-3 w-3" />
                    In progress
                  </Badge>
                )}
                {course.status === 'enrolled' && (
                  <Badge className="border-0 bg-white/90 text-purple-700">Ready to start</Badge>
                )}
              </div>
              <div className="mb-4 flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 shadow-lg backdrop-blur-sm">
                  <GraduationCap className="h-8 w-8 text-white" />
                </div>
                <div className="min-w-0">
                  <h1 className="mb-2 text-3xl font-bold leading-tight text-white drop-shadow-md sm:text-4xl">
                    {course.title}
                  </h1>
                  <p className="text-base font-medium text-white/90 sm:text-lg">{course.description}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 text-sm text-white/90">
                {course.rating > 0 && (
                  <div className="flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-1.5 backdrop-blur-sm">
                    <Star className="h-4 w-4 fill-yellow-300 text-yellow-200" />
                    <span className="font-semibold">{course.rating}</span>
                    {course.enrolledCount > 0 && <span className="text-white/80">({course.enrolledCount})</span>}
                  </div>
                )}
                <div className="flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-1.5 backdrop-blur-sm">
                  <Clock className="h-4 w-4 shrink-0" />
                  <span>{course.duration > 0 ? `${course.duration} hours` : 'Self-paced'}</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-1.5 backdrop-blur-sm">
                  <Library className="h-4 w-4 shrink-0" />
                  <span>{totalLessons} lessons</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-1.5 backdrop-blur-sm">
                  <Users className="h-4 w-4 shrink-0" />
                  <span>{course.instructor}</span>
                </div>
              </div>
              {course.progress !== undefined && totalLessons > 0 && (
                <div className="mt-5 max-w-xl space-y-2 rounded-xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
                  <div className="flex items-center justify-between text-sm font-medium text-white">
                    <span>Overall progress</span>
                    <span>{course.progress}%</span>
                  </div>
                  <div className="relative h-3 w-full overflow-hidden rounded-full bg-white/25">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-300 to-pink-300 shadow-sm transition-all duration-500"
                      style={{ width: `${course.progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-white/80">
                    {completedLessons} of {totalLessons} lessons completed — keep going! 💪
                  </p>
                </div>
              )}
            </div>
            <div className="w-full shrink-0 lg:w-80">
              <Card className="border-2 border-purple-200/80 bg-gradient-to-br from-white to-purple-50/90 shadow-xl">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 shadow-md">
                      <Play className="h-4 w-4 text-white" />
                    </div>
                    <CardTitle className="text-lg text-gray-800">Jump in 🚀</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {!firstLesson ? (
                    <p className="text-sm text-gray-600">Lessons aren&apos;t available for this course yet.</p>
                  ) : course.status === 'available' ? (
                    <Button className="w-full font-semibold" size="lg" disabled variant="secondary">
                      Enroll in course
                    </Button>
                  ) : course.status === 'in_progress' && currentLesson ? (
                    <Button
                      asChild
                      className="w-full bg-gradient-to-r from-orange-500 to-amber-500 font-semibold shadow-md hover:from-orange-600 hover:to-amber-600"
                      size="lg"
                    >
                      <Link href={`/trainee/courses/${course.id}/lessons/${currentLesson.id}`}>
                        <Play className="mr-2 h-4 w-4" />
                        Continue learning
                      </Link>
                    </Button>
                  ) : course.status === 'in_progress' ? (
                    <Button asChild className="w-full border-2 font-semibold" size="lg" variant="outline">
                      <Link href={`/trainee/courses/${course.id}/lessons/${firstLesson.id}`}>Review course</Link>
                    </Button>
                  ) : course.status === 'completed' ? (
                    <Button
                      asChild
                      className="w-full border-2 border-green-300 font-semibold text-green-800 hover:bg-green-50"
                      size="lg"
                      variant="outline"
                    >
                      <Link href={`/trainee/courses/${course.id}/lessons/${firstLesson.id}`}>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Review course
                      </Link>
                    </Button>
                  ) : (
                    <Button
                      asChild
                      className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 font-semibold shadow-md hover:from-blue-600 hover:to-indigo-700"
                      size="lg"
                    >
                      <Link href={`/trainee/courses/${course.id}/lessons/${firstLesson.id}`}>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Start course
                      </Link>
                    </Button>
                  )}
                  {course.status !== 'available' && course.enrolledDate && (
                    <div className="text-sm text-gray-600 pt-2 border-t">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>Enrolled {new Date(course.enrolledDate).toLocaleDateString()}</span>
                      </div>
                      {course.completedDate && (
                        <div className="flex items-center gap-2 mt-1">
                          <Award className="h-4 w-4 text-green-600" />
                          <span>Completed {new Date(course.completedDate).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Course Content */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-2 border-indigo-200 bg-gradient-to-br from-indigo-50/80 to-white">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500 shadow-sm">
                    <BookOpen className="h-5 w-5 text-white" />
                  </div>
                  <CardTitle className="text-xl text-gray-800">About this course 📖</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-line text-gray-700">{course.fullDescription}</p>
              </CardContent>
            </Card>

            {course.objectives.length > 0 && (
              <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50/50 to-white">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500 shadow-sm">
                      <Target className="h-5 w-5 text-white" />
                    </div>
                    <CardTitle className="text-xl text-gray-800">Learning objectives 🎯</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {course.objectives.map((objective, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <Target className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{objective}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Prerequisites */}
            {course.prerequisites.length > 0 && (
              <Card className="border-2 border-teal-200 bg-gradient-to-br from-teal-50/50 to-white">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-500 shadow-sm">
                      <CheckCircle className="h-5 w-5 text-white" />
                    </div>
                    <CardTitle className="text-xl text-gray-800">Prerequisites ✅</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {course.prerequisites.map((prereq, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{prereq}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Course Curriculum */}
          <div className="lg:col-span-1" id="lessons">
            <Card className="border-2 border-gray-200 bg-gradient-to-br from-gray-50/90 to-white shadow-md">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 shadow-md">
                    <Library className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl text-gray-800">Curriculum 📚</CardTitle>
                    <CardDescription className="text-gray-600">
                      {completedLessons} of {totalLessons} lessons completed
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {course.lessons.map((lesson, index) => (
                    <div key={lesson.id}>
                      <Link
                        href={`/trainee/courses/${course.id}/lessons/${lesson.id}`}
                        className={`flex items-center gap-3 rounded-xl border-2 p-3 transition-all ${
                          lesson.completed
                            ? 'border-green-200 bg-gradient-to-r from-green-50/80 to-white hover:shadow-md'
                            : currentLesson?.id === lesson.id
                              ? 'border-blue-300 bg-gradient-to-r from-blue-50 to-indigo-50/50 shadow-sm hover:shadow-md'
                              : 'border-transparent hover:border-gray-200 hover:bg-white/80'
                        }`}
                      >
                        <div className={`flex-shrink-0 ${
                          lesson.completed ? 'text-green-600' : 
                          currentLesson?.id === lesson.id ? 'text-blue-600' : 
                          'text-gray-400'
                        }`}>
                          {lesson.completed ? (
                            <CheckCircle className="h-5 w-5" />
                          ) : (
                            <div className="h-5 w-5 rounded-full border-2 border-current flex items-center justify-center">
                              <span className="text-xs font-medium">{lesson.order}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <div className={`${
                              lesson.completed ? 'text-green-600' : 
                              currentLesson?.id === lesson.id ? 'text-blue-600' : 
                              'text-gray-400'
                            }`}>
                              {getLessonIcon(lesson.type)}
                            </div>
                            <span className="text-xs text-gray-500">
                              {getLessonTypeLabel(lesson.type)}
                            </span>
                            {lesson.duration > 0 && (
                              <span className="text-xs text-gray-400">{lesson.duration} min</span>
                            )}
                          </div>
                          <p className={`text-sm font-medium ${
                            lesson.completed || currentLesson?.id === lesson.id
                              ? 'text-gray-900'
                              : 'text-gray-600'
                          }`}>
                            {lesson.title}
                          </p>
                        </div>
                        {currentLesson?.id === lesson.id && !lesson.completed && (
                          <Play className="h-4 w-4 text-blue-600 flex-shrink-0" />
                        )}
                      </Link>
                      {index < course.lessons.length - 1 && (
                        <Separator className="my-1" />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </RoleGate>
  );
}
