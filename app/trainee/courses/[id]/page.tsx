import { RoleGate } from '../../../../components/RoleGate';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
  Download
} from 'lucide-react';
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
        {/* Back Button */}
        <Button asChild variant="ghost" className="mb-4">
          <Link href="/trainee/courses">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Courses
          </Link>
        </Button>

        {/* Course Header */}
        <div className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-lg p-6 border border-blue-200/20">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <Badge 
                  variant="outline"
                  className={
                    course.difficulty === 'beginner' ? 'bg-green-50 text-green-700 border-green-200' :
                    course.difficulty === 'intermediate' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                    'bg-purple-50 text-purple-700 border-purple-200'
                  }
                >
                  {course.difficulty.charAt(0).toUpperCase() + course.difficulty.slice(1)}
                </Badge>
                <Badge variant="outline">{course.category}</Badge>
                {course.status === 'completed' && (
                  <Badge className="bg-green-500">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Completed
                  </Badge>
                )}
                {course.status === 'in_progress' && (
                  <Badge className="bg-orange-500">
                    <Play className="h-3 w-3 mr-1" />
                    In Progress
                  </Badge>
                )}
                {course.status === 'enrolled' && (
                  <Badge variant="secondary">Enrolled</Badge>
                )}
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-3">{course.title}</h1>
              <p className="text-lg text-gray-600 mb-4">{course.description}</p>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                {course.rating > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{course.rating}</span>
                    {course.enrolledCount > 0 && (
                      <span>({course.enrolledCount} enrolled)</span>
                    )}
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{course.duration > 0 ? `${course.duration} hours` : 'Self-paced'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <BookOpen className="h-4 w-4" />
                  <span>{totalLessons} lessons</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>Instructor: {course.instructor}</span>
                </div>
              </div>
              {course.progress !== undefined && totalLessons > 0 && (
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Overall Progress</span>
                    <span className="font-medium">{course.progress}%</span>
                  </div>
                  <Progress value={course.progress} className="h-3" />
                  <p className="text-xs text-gray-500">
                    {completedLessons} of {totalLessons} lessons completed
                  </p>
                </div>
              )}
            </div>
            <div className="lg:w-80">
              <Card>
                <CardHeader>
                  <CardTitle>Course Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {!firstLesson ? (
                    <p className="text-sm text-gray-600">Lessons are not available for this course yet.</p>
                  ) : course.status === 'available' ? (
                    <Button className="w-full" size="lg" disabled>
                      Enroll in Course
                    </Button>
                  ) : course.status === 'in_progress' && currentLesson ? (
                    <Button asChild className="w-full" size="lg">
                      <Link href={`/trainee/courses/${course.id}/lessons/${currentLesson.id}`}>
                        <Play className="h-4 w-4 mr-2" />
                        Continue Learning
                      </Link>
                    </Button>
                  ) : course.status === 'in_progress' ? (
                    <Button asChild className="w-full" size="lg" variant="outline">
                      <Link href={`/trainee/courses/${course.id}/lessons/${firstLesson.id}`}>
                        Review Course
                      </Link>
                    </Button>
                  ) : course.status === 'completed' ? (
                    <Button asChild className="w-full" size="lg" variant="outline">
                      <Link href={`/trainee/courses/${course.id}/lessons/${firstLesson.id}`}>
                        Review Course
                      </Link>
                    </Button>
                  ) : (
                    <Button asChild className="w-full" size="lg">
                      <Link href={`/trainee/courses/${course.id}/lessons/${firstLesson.id}`}>
                        Start Course
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
            {/* About Course */}
            <Card>
              <CardHeader>
                <CardTitle>About This Course</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-line">{course.fullDescription}</p>
              </CardContent>
            </Card>

            {/* Course Objectives */}
            {course.objectives.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Learning Objectives</CardTitle>
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
              <Card>
                <CardHeader>
                  <CardTitle>Prerequisites</CardTitle>
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
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Course Curriculum</CardTitle>
                <CardDescription>
                  {completedLessons} of {totalLessons} lessons completed
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {course.lessons.map((lesson, index) => (
                    <div key={lesson.id}>
                      <Link
                        href={`/trainee/courses/${course.id}/lessons/${lesson.id}`}
                        className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                          lesson.completed
                            ? 'bg-green-50 border border-green-200'
                            : currentLesson?.id === lesson.id
                              ? 'bg-blue-50 border border-blue-200'
                              : 'hover:bg-gray-50 border border-transparent'
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
