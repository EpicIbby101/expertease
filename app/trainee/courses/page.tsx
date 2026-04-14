import { RoleGate } from '../../../components/RoleGate';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Link from 'next/link';
import {
  BookOpen,
  Search,
  Clock,
  Users,
  Star,
  ArrowRight,
  Play,
  CheckCircle,
  Filter,
  Sparkles,
  Trophy,
  Zap,
  GraduationCap,
} from 'lucide-react';

const HERO_PATTERN =
  "bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIzMCIvPjwvZz48L2c+PC9zdmc+')]";

type CatalogStatus = 'available' | 'enrolled' | 'completed' | 'in_progress';

function catalogCardLook(status: CatalogStatus) {
  const map = {
    completed: {
      card: 'border-2 border-green-200 bg-gradient-to-br from-green-50/90 to-white shadow-md hover:shadow-lg',
      icon: 'from-green-500 to-emerald-600',
      emoji: '✅',
    },
    in_progress: {
      card: 'border-2 border-orange-200 bg-gradient-to-br from-orange-50/90 to-white shadow-md hover:shadow-lg',
      icon: 'from-orange-500 to-amber-500',
      emoji: '🔥',
    },
    enrolled: {
      card: 'border-2 border-blue-200 bg-gradient-to-br from-blue-50/90 to-white shadow-md hover:shadow-lg',
      icon: 'from-blue-500 to-indigo-600',
      emoji: '📘',
    },
    available: {
      card: 'border-2 border-gray-200 bg-gradient-to-br from-gray-50/90 to-white shadow-md hover:shadow-lg',
      icon: 'from-gray-400 to-gray-500',
      emoji: '📋',
    },
  } as const;
  return map[status] ?? map.available;
}
import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';
import { getPublishedCoursesForCatalog } from '@/lib/courses';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function CoursesPage() {
  const { userId } = await auth();
  
  if (!userId) {
    return null;
  }

  const courses = await getPublishedCoursesForCatalog(userId);

  // Get user details for personalized header
  const { data: currentUser } = await supabase
    .from('users')
    .select('first_name, last_name, email, company_name')
    .eq('user_id', userId)
    .single();

  const displayName = currentUser?.first_name && currentUser?.last_name 
    ? `${currentUser.first_name} ${currentUser.last_name}`
    : currentUser?.first_name 
    ? currentUser.first_name
    : currentUser?.email || 'Trainee';

  const enrolledCourses = courses.filter(c => c.status !== 'available').length;
  const completedCourses = courses.filter(c => c.status === 'completed').length;
  const inProgressCourses = courses.filter(c => c.status === 'in_progress').length;

  const firstName = displayName.split(' ')[0];

  return (
    <RoleGate requiredRole="trainee">
      <div className="space-y-6">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 p-8 shadow-lg">
          <div className={`absolute inset-0 ${HERO_PATTERN} opacity-20`} />
          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/20 shadow-lg backdrop-blur-sm">
                <GraduationCap className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="mb-2 text-3xl font-bold tracking-tight text-white drop-shadow-md sm:text-4xl">
                  Courses 📚
                </h1>
                <p className="text-lg font-medium text-white/90">
                  Hey {firstName}! Pick up where you left off or explore something new.
                </p>
                <p className="mt-2 text-sm text-white/80">
                  Build skills at your pace — every lesson counts. ✨
                </p>
              </div>
            </div>
            <Link href="/trainee/dashboard">
              <Button
                size="lg"
                className="border-2 border-white/40 bg-white/20 font-semibold text-white shadow-xl backdrop-blur-sm hover:bg-white/30"
              >
                <Sparkles className="mr-2 h-5 w-5" />
                Back to dashboard
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100/50 transition-all hover:-translate-y-0.5 hover:shadow-md">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500 shadow-md">
                  <BookOpen className="h-5 w-5 text-white" />
                </div>
                <span className="text-2xl" aria-hidden>
                  📖
                </span>
              </div>
              <CardTitle className="text-base text-gray-700">Active</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-600">{enrolledCourses}</p>
              <p className="text-xs text-gray-600">Courses you&apos;re on</p>
            </CardContent>
          </Card>
          <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-green-100/50 transition-all hover:-translate-y-0.5 hover:shadow-md">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-500 shadow-md">
                  <Trophy className="h-5 w-5 text-white" />
                </div>
                <span className="text-2xl" aria-hidden>
                  🏆
                </span>
              </div>
              <CardTitle className="text-base text-gray-700">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">{completedCourses}</p>
              <p className="text-xs text-gray-600">Nice work!</p>
            </CardContent>
          </Card>
          <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100/50 transition-all hover:-translate-y-0.5 hover:shadow-md">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-500 shadow-md">
                  <Zap className="h-5 w-5 text-white" />
                </div>
                <span className="text-2xl" aria-hidden>
                  ⚡
                </span>
              </div>
              <CardTitle className="text-base text-gray-700">In progress</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-orange-600">{inProgressCourses}</p>
              <p className="text-xs text-gray-600">Keep the momentum</p>
            </CardContent>
          </Card>
        </div>

        <Card className="border-2 border-indigo-200 bg-gradient-to-br from-indigo-50/80 to-white">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500 shadow-sm">
                <Filter className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg text-gray-800">Find a course 🔎</CardTitle>
                <CardDescription>Search and filters (coming soon will narrow the list)</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search courses..."
                    className="pl-10"
                  />
                </div>
              </div>
              <Select defaultValue="all">
                <SelectTrigger className="w-full sm:w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="safety">Safety</SelectItem>
                  <SelectItem value="operations">Operations</SelectItem>
                  <SelectItem value="quality">Quality</SelectItem>
                  <SelectItem value="skills">Skills</SelectItem>
                  <SelectItem value="professional-development">Professional Development</SelectItem>
                </SelectContent>
              </Select>
              <Select defaultValue="all">
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
              <Select defaultValue="all">
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Courses</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="enrolled">Enrolled</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => {
            const look = catalogCardLook(course.status);
            return (
              <Card
                key={course.id}
                className={`flex flex-col transition-all duration-200 hover:-translate-y-1 ${look.card}`}
              >
                <CardHeader className="pb-3">
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br shadow-md ${look.icon}`}
                    >
                      <span className="text-xl" aria-hidden>
                        {look.emoji}
                      </span>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge
                        variant="outline"
                        className={
                          course.difficulty === 'beginner'
                            ? 'border-green-200 bg-green-50 text-green-700'
                            : course.difficulty === 'intermediate'
                              ? 'border-blue-200 bg-blue-50 text-blue-700'
                              : 'border-purple-200 bg-purple-50 text-purple-700'
                        }
                      >
                        {course.difficulty.charAt(0).toUpperCase() + course.difficulty.slice(1)}
                      </Badge>
                      {course.status === 'completed' && (
                        <Badge className="border-0 bg-green-500 hover:bg-green-600">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Completed
                        </Badge>
                      )}
                      {course.status === 'in_progress' && (
                        <Badge className="border-0 bg-orange-500 hover:bg-orange-600">
                          <Play className="mr-1 h-3 w-3" />
                          In progress
                        </Badge>
                      )}
                      {course.status === 'enrolled' && (
                        <Badge className="border-blue-200 bg-blue-100 text-blue-800">Ready to start</Badge>
                      )}
                    </div>
                  </div>
                  <CardTitle className="line-clamp-2 text-xl text-gray-900">{course.title}</CardTitle>
                  <CardDescription className="line-clamp-2 mt-1 text-gray-600">
                    {course.description || 'Open to see lessons and materials.'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col">
                  <div className="mb-4 space-y-3">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
                      <div className="flex items-center gap-1.5">
                        <BookOpen className="h-4 w-4 text-indigo-600" />
                        <span>{course.category}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-4 w-4 text-purple-500" />
                        <span>{course.duration > 0 ? `${course.duration}h` : 'Self-paced'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Users className="h-4 w-4 text-pink-500" />
                        <span>{course.lessons} lessons</span>
                      </div>
                    </div>
                    {course.rating > 0 && (
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium">{course.rating}</span>
                        {course.enrolledCount > 0 && (
                          <span className="text-xs text-gray-500">({course.enrolledCount})</span>
                        )}
                      </div>
                    )}
                    {course.progress !== undefined && course.progress > 0 && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-medium">
                          <span className="text-gray-600">Your progress</span>
                          <span className="text-indigo-600">{course.progress}%</span>
                        </div>
                        <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-200">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 shadow-sm transition-all"
                            style={{ width: `${course.progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="mt-auto border-t border-gray-200/80 pt-4">
                    {course.status === 'available' ? (
                      <Button
                        asChild
                        className="w-full bg-gradient-to-r from-gray-600 to-gray-700 font-semibold shadow-md hover:from-gray-700 hover:to-gray-800"
                      >
                        <Link href={`/trainee/courses/${course.id}`}>
                          View course
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    ) : course.status === 'in_progress' ? (
                      <Button
                        asChild
                        className="w-full bg-gradient-to-r from-orange-500 to-amber-500 font-semibold shadow-md hover:from-orange-600 hover:to-amber-600"
                      >
                        <Link href={`/trainee/courses/${course.id}`}>
                          <Play className="mr-2 h-4 w-4" />
                          Continue learning
                        </Link>
                      </Button>
                    ) : course.status === 'completed' ? (
                      <Button asChild variant="outline" className="w-full border-2 border-green-300 font-semibold text-white hover:bg-gray-500">
                        <Link href={`/trainee/courses/${course.id}`}>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Review course
                        </Link>
                      </Button>
                    ) : (
                      <Button
                        asChild
                        className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 font-semibold shadow-md hover:from-blue-600 hover:to-indigo-700"
                      >
                        <Link href={`/trainee/courses/${course.id}`}>
                          <Sparkles className="mr-2 h-4 w-4" />
                          Start course
                        </Link>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {courses.length === 0 && (
          <Card className="border-2 border-dashed border-purple-200 bg-gradient-to-br from-purple-50 to-white">
            <CardContent className="py-14 text-center">
              <div className="mb-4 text-5xl" aria-hidden>
                📚
              </div>
              <h3 className="mb-2 text-lg font-semibold text-gray-900">No published courses yet</h3>
              <p className="mx-auto mb-6 max-w-md text-gray-600">
                When your team adds courses in the catalog, they&apos;ll show up here. You can still check your
                dashboard anytime.
              </p>
              <Button asChild className="bg-purple-600 hover:bg-purple-700">
                <Link href="/trainee/dashboard">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Go to dashboard
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </RoleGate>
  );
}
