import { RoleGate } from '../../../components/RoleGate';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { BookOpen, Award, CheckCircle, Play, Target, TrendingUp, Users, ArrowRight, Sparkles, Trophy, Rocket, Star, Zap } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';
import TraineeDashboardHeader from '@/components/TraineeDashboardHeader';
import { getTraineeDashboardLearning } from '@/lib/courses';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getTraineeStats(userId: string) {
  try {
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, first_name, last_name, role, company_id, company_name, created_at, last_active_at')
      .eq('user_id', userId)
      .single();

    if (userError || !user || user.role !== 'trainee') {
      return null;
    }

    const learning = await getTraineeDashboardLearning(userId);

    return {
      stats: {
        enrolledCourses: learning.enrolledCourses,
        completedCourses: learning.completedCourses,
        inProgressCourses: learning.inProgressCourses,
        lessonCompletionRate: learning.lessonCompletionRate,
        lessonsCompleted: learning.lessonsCompleted,
        lessonsTotal: learning.lessonsTotal,
        overallCompletionRate: learning.overallCourseCompletionRate,
        engagementScore: learning.engagementScore,
      },
      courseProgress: learning.courseProgress,
    };
  } catch (error) {
    console.error('Error fetching trainee stats:', error);
    return null;
  }
}

function getMotivationalMessage(completionRate: number, engagementScore: number) {
  if (completionRate >= 100) return { message: "🌟 Outstanding! You're a learning champion!", emoji: '🏆' };
  if (completionRate >= 75) return { message: '🎉 Amazing progress! Keep up the momentum!', emoji: '⚡' };
  if (completionRate >= 50) return { message: "🚀 You're halfway there! You've got this!", emoji: '💪' };
  if (completionRate >= 25) return { message: '⭐ Great start! Every journey begins with a single step!', emoji: '🌱' };
  if (engagementScore >= 70) return { message: "🔥 You're showing up — keep building on it!", emoji: '📚' };
  return { message: '🌱 Ready to begin your learning adventure?', emoji: '📚' };
}

export default async function TraineeDashboard() {
  const { userId } = await auth();
  
  if (!userId) {
    return null;
  }

  // Get current user details for personalized greeting
  const { data: currentUser } = await supabase
    .from('users')
    .select('first_name, last_name, email, company_name')
    .eq('user_id', userId)
    .single();

  // Fetch trainee statistics
  const data = await getTraineeStats(userId);
  
  const stats = data?.stats || {
    enrolledCourses: 0,
    completedCourses: 0,
    inProgressCourses: 0,
    lessonCompletionRate: 0,
    lessonsCompleted: 0,
    lessonsTotal: 0,
    overallCompletionRate: 0,
    engagementScore: 0,
  };

  const courseProgress = data?.courseProgress || [];
  
  // Prepare personalized welcome message
  const displayName = currentUser?.first_name && currentUser?.last_name 
    ? `${currentUser.first_name} ${currentUser.last_name}`
    : currentUser?.first_name 
    ? currentUser.first_name
    : currentUser?.email || 'Trainee';

  const motivational = getMotivationalMessage(stats.overallCompletionRate, stats.engagementScore);

  return (
    <RoleGate requiredRole="trainee">
      <div className="space-y-6">
        {/* Fun & Colorful Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 p-8 shadow-lg">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIzMCIvPjwvZz48L2c+PC9zdmc+')] opacity-20"></div>
          <div className="relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg transform hover:scale-110 transition-transform">
                  <Rocket className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-white mb-2 drop-shadow-lg">
                    Hey {displayName.split(' ')[0]}! 👋
                  </h1>
                  <p className="text-white/90 text-lg font-medium mb-1">
                    {motivational.message}
                  </p>
                  <div className="flex items-center gap-2 text-white/80 text-sm">
                    <Users className="h-4 w-4" />
                    <span>{currentUser?.company_name || 'Your Company'}</span>
                  </div>
                </div>
              </div>
              <TraineeDashboardHeader />
            </div>
          </div>
        </div>

        {/* Stats Cards with Fun Colors */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100/50 hover:shadow-lg transition-all hover:-translate-y-1">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-md">
                  <BookOpen className="h-6 w-6 text-white" />
                </div>
                <span className="text-3xl">📚</span>
              </div>
              <CardTitle className="text-gray-700 mt-4">Enrolled Courses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600 mb-1">{stats.enrolledCourses}</div>
              <p className="text-sm text-gray-600">Keep learning! 🎓</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-green-100/50 hover:shadow-lg transition-all hover:-translate-y-1">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center shadow-md">
                  <Trophy className="h-6 w-6 text-white" />
                </div>
                <span className="text-3xl">🏆</span>
              </div>
              <CardTitle className="text-gray-700 mt-4">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600 mb-1">{stats.completedCourses}</div>
              <p className="text-sm text-gray-600">Awesome work! ⭐</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100/50 hover:shadow-lg transition-all hover:-translate-y-1">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center shadow-md">
                  <Play className="h-6 w-6 text-white" />
                </div>
                <span className="text-3xl">⚡</span>
              </div>
              <CardTitle className="text-gray-700 mt-4">In Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600 mb-1">{stats.inProgressCourses}</div>
              <p className="text-sm text-gray-600">Keep going! 💪</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100/50 hover:shadow-lg transition-all hover:-translate-y-1">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center shadow-md">
                  <Star className="h-6 w-6 text-white" />
                </div>
                <span className="text-3xl">⭐</span>
              </div>
              <CardTitle className="text-gray-700 mt-4">Lesson progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600 mb-1">{stats.lessonCompletionRate}%</div>
              <p className="text-sm text-gray-600">
                {stats.lessonsTotal > 0
                  ? `${stats.lessonsCompleted} of ${stats.lessonsTotal} lessons done`
                  : 'No lessons yet — check back soon'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Performance Overview - More Fun Design */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-white">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center">
                  <Target className="h-5 w-5 text-white" />
                </div>
                <CardTitle className="text-xl text-gray-800">Your Progress 🎯</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Overall Completion</span>
                  <span className="text-lg font-bold text-indigo-600">{stats.overallCompletionRate}%</span>
                </div>
                <div className="relative w-full h-4 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500 shadow-md"
                    style={{ width: `${stats.overallCompletionRate}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.enrolledCourses > 0
                    ? `${stats.completedCourses} of ${stats.enrolledCourses} courses fully completed`
                    : 'No published courses yet'}
                </p>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Engagement Level</span>
                  <span className="text-lg font-bold text-pink-600">{stats.engagementScore}%</span>
                </div>
                <div className="relative w-full h-4 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-pink-500 to-rose-500 rounded-full transition-all duration-500 shadow-md"
                    style={{ width: `${stats.engagementScore}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.engagementScore >= 80
                    ? "🔥 Based on your recent activity on the platform"
                    : stats.engagementScore >= 55
                      ? '💪 Steady — a little activity goes a long way'
                      : '📚 Jump back in when you can — we’ll be here'}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-teal-200 bg-gradient-to-br from-teal-50 to-white">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-teal-500 rounded-lg flex items-center justify-center">
                  <Award className="h-5 w-5 text-white" />
                </div>
                <CardTitle className="text-xl text-gray-800">Quick Stats 📊</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-xl border border-teal-100 bg-white p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-100">
                    <TrendingUp className="h-5 w-5 text-teal-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Lessons completed</p>
                    <p className="text-2xl font-bold text-teal-600">
                      {stats.lessonsTotal > 0 ? `${stats.lessonsCompleted} / ${stats.lessonsTotal}` : '—'}
                    </p>
                  </div>
                </div>
                <span className="text-3xl" aria-hidden>
                  {stats.lessonCompletionRate >= 90 ? '🌟' : stats.lessonCompletionRate >= 50 ? '⭐' : '💫'}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-teal-100 bg-white p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-pink-100">
                    <Zap className="h-5 w-5 text-pink-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Lesson progress</p>
                    <p className="text-2xl font-bold text-pink-600">
                      {stats.lessonsTotal > 0 ? `${stats.lessonCompletionRate}%` : '—'}
                    </p>
                  </div>
                </div>
                <span className="text-3xl" aria-hidden>
                  🎯
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Course Progress - More Engaging */}
        <Card className="border-2 border-gray-200 bg-gradient-to-br from-gray-50 to-white">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-white" />
                </div>
                <CardTitle className="text-xl text-gray-800">My Courses 📖</CardTitle>
              </div>
              <Link href="/trainee/courses">
                <Button variant="outline" className="gap-2">
                  View All
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {courseProgress.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📚</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No courses yet</h3>
                <p className="text-gray-600 mb-4">Start your learning journey today!</p>
                <Link href="/trainee/courses">
                  <Button className="gap-2">
                    <Sparkles className="h-4 w-4" />
                    Browse Courses
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {courseProgress.map((course) => {
                  const statusColors = {
                    completed: {
                      bg: 'from-green-500 to-emerald-500',
                      text: 'text-green-700',
                      border: 'border-green-200',
                      rowBg: 'from-white to-green-50/90',
                      emoji: '✅',
                    },
                    in_progress: {
                      bg: 'from-orange-500 to-amber-500',
                      text: 'text-orange-700',
                      border: 'border-orange-200',
                      rowBg: 'from-white to-orange-50/90',
                      emoji: '🔥',
                    },
                    not_started: {
                      bg: 'from-gray-400 to-gray-500',
                      text: 'text-gray-700',
                      border: 'border-gray-200',
                      rowBg: 'from-white to-gray-50/90',
                      emoji: '📋',
                    },
                  };
                  const colors =
                    statusColors[course.status as keyof typeof statusColors] || statusColors.not_started;

                  return (
                    <div
                      key={course.courseId}
                      className={`rounded-xl border-2 p-5 ${colors.border} bg-gradient-to-r ${colors.rowBg} transition-all hover:shadow-lg`}
                    >
                      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex min-w-0 flex-1 items-start gap-3">
                          <div
                            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br shadow-md ${colors.bg}`}
                          >
                            <span className="text-2xl" aria-hidden>
                              {colors.emoji}
                            </span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="mb-1 font-bold text-gray-900">{course.courseName}</h4>
                            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                              <Badge variant="outline" className={colors.border}>
                                {course.status === 'completed'
                                  ? 'Completed'
                                  : course.status === 'in_progress'
                                    ? 'In progress'
                                    : 'Not started'}
                              </Badge>
                              {course.enrolledDate && (
                                <span className="text-xs text-gray-500">
                                  Activity from {new Date(course.enrolledDate).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
                          {course.status === 'not_started' && (
                            <Link href={`/trainee/courses/${course.courseId}`}>
                              <Button size="sm" className="gap-2 bg-gradient-to-r from-blue-500 to-indigo-600">
                                <Play className="h-4 w-4" />
                                Start
                              </Button>
                            </Link>
                          )}
                          {course.status === 'in_progress' && (
                            <Link href={`/trainee/courses/${course.courseId}`}>
                              <Button size="sm" variant="default" className="gap-2">
                                <Play className="h-4 w-4" />
                                Continue
                              </Button>
                            </Link>
                          )}
                          {course.status === 'completed' && (
                            <Link href={`/trainee/courses/${course.courseId}`}>
                              <Button size="sm" variant="outline" className="gap-2">
                                <CheckCircle className="h-4 w-4" />
                                Review
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>

                      <div className="mt-3">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-sm text-gray-600">Progress</span>
                          <span className="text-sm font-bold text-gray-900">{course.progress}%</span>
                        </div>
                        <div className="relative h-3 w-full overflow-hidden rounded-full bg-gray-200">
                          <div
                            className={`h-full rounded-full bg-gradient-to-r shadow-sm transition-all duration-500 ${colors.bg}`}
                            style={{ width: `${course.progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </RoleGate>
  );
} 