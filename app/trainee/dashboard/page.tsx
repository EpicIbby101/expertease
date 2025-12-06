import { RoleGate } from '../../../components/RoleGate';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { BookOpen, Award, Clock, CheckCircle, Play, Target, TrendingUp, User, Users, Activity, ArrowRight, Calendar, Sparkles, Trophy, Rocket, Star, Zap, HelpCircle } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';
import TraineeDashboardHeader from '@/components/TraineeDashboardHeader';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getTraineeStats(userId: string) {
  try {
    // Get user details and verify they're a trainee
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, first_name, last_name, role, company_id, company_name, created_at, last_active_at')
      .eq('user_id', userId)
      .single();

    if (userError || !user || user.role !== 'trainee') {
      return null;
    }

    // For now, we'll simulate course data since we don't have a courses/training_progress table yet
    const enrolledCourses = 4;
    const completedCourses = Math.floor(Math.random() * enrolledCourses) + 1;
    const inProgressCourses = enrolledCourses - completedCourses;
    
    const baseScore = 70 + Math.random() * 25;
    const completionBonus = (completedCourses / enrolledCourses) > 0.75 ? 5 : 0;
    const averageScore = Math.min(100, Math.round((baseScore + completionBonus) * 10) / 10);

    const courseProgress = [
      {
        courseId: '1',
        courseName: 'Safety Training Fundamentals',
        progress: completedCourses >= 1 ? 100 : completedCourses >= 0 ? Math.floor(Math.random() * 80) + 10 : 0,
        status: completedCourses >= 1 ? 'completed' : completedCourses >= 0 ? 'in_progress' : 'not_started',
        score: completedCourses >= 1 ? Math.round((78 + Math.random() * 20) * 10) / 10 : null,
        enrolledDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        completedDate: completedCourses >= 1 ? new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() : null
      },
      {
        courseId: '2',
        courseName: 'Equipment Handling & Maintenance',
        progress: completedCourses >= 2 ? 100 : completedCourses >= 1 ? Math.floor(Math.random() * 80) + 10 : 0,
        status: completedCourses >= 2 ? 'completed' : completedCourses >= 1 ? 'in_progress' : 'not_started',
        score: completedCourses >= 2 ? Math.round((82 + Math.random() * 15) * 10) / 10 : null,
        enrolledDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
        completedDate: completedCourses >= 2 ? new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() : null
      },
      {
        courseId: '3',
        courseName: 'Emergency Procedures & Response',
        progress: completedCourses >= 3 ? 100 : completedCourses >= 2 ? Math.floor(Math.random() * 80) + 10 : 0,
        status: completedCourses >= 3 ? 'completed' : completedCourses >= 2 ? 'in_progress' : 'not_started',
        score: completedCourses >= 3 ? Math.round((85 + Math.random() * 12) * 10) / 10 : null,
        enrolledDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
        completedDate: completedCourses >= 3 ? new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() : null
      },
      {
        courseId: '4',
        courseName: 'Quality Standards',
        progress: completedCourses >= 4 ? 100 : completedCourses >= 3 ? Math.floor(Math.random() * 80) + 10 : 0,
        status: completedCourses >= 4 ? 'completed' : completedCourses >= 3 ? 'in_progress' : 'not_started',
        score: completedCourses >= 4 ? Math.round((78 + Math.random() * 20) * 10) / 10 : null,
        enrolledDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        completedDate: completedCourses >= 4 ? new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() : null
      }
    ];

    const overallCompletionRate = enrolledCourses > 0 
      ? Math.round((completedCourses / enrolledCourses) * 100 * 10) / 10
      : 0;

    const daysSinceLastLogin = user.last_active_at 
      ? Math.floor((new Date().getTime() - new Date(user.last_active_at).getTime()) / (1000 * 60 * 60 * 24))
      : 30;
    
    let engagementScore;
    if (daysSinceLastLogin <= 1) engagementScore = 90 + Math.random() * 10;
    else if (daysSinceLastLogin <= 7) engagementScore = 70 + Math.random() * 20;
    else if (daysSinceLastLogin <= 30) engagementScore = 40 + Math.random() * 30;
    else engagementScore = 10 + Math.random() * 30;

    return {
      stats: {
        enrolledCourses,
        completedCourses,
        inProgressCourses,
        averageScore,
        overallCompletionRate,
        engagementScore: Math.round(engagementScore * 10) / 10
      },
      courseProgress
    };
  } catch (error) {
    console.error('Error fetching trainee stats:', error);
    return null;
  }
}

function getMotivationalMessage(completionRate: number, engagementScore: number) {
  if (completionRate >= 100) return { message: "🌟 Outstanding! You're a learning champion!", emoji: "🏆" };
  if (completionRate >= 75) return { message: "🎉 Amazing progress! Keep up the momentum!", emoji: "⚡" };
  if (completionRate >= 50) return { message: "🚀 You're halfway there! You've got this!", emoji: "💪" };
  if (completionRate >= 25) return { message: "⭐ Great start! Every journey begins with a single step!", emoji: "🌱" };
  return { message: "🌱 Ready to begin your learning adventure?", emoji: "📚" };
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
    averageScore: 0,
    overallCompletionRate: 0,
    engagementScore: 0
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
              <CardTitle className="text-gray-700 mt-4">Avg Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600 mb-1">{stats.averageScore}%</div>
              <p className="text-sm text-gray-600">You're crushing it! 🚀</p>
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
                  {stats.completedCourses} of {stats.enrolledCourses} courses completed
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
                  {stats.engagementScore >= 80 ? "🔥 You're on fire!" : stats.engagementScore >= 60 ? "💪 Great momentum!" : "📚 Keep learning!"}
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
              <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-teal-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-teal-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Average Score</p>
                    <p className="text-2xl font-bold text-teal-600">{stats.averageScore}%</p>
                  </div>
                </div>
                <span className="text-3xl">
                  {stats.averageScore >= 90 ? "🌟" : stats.averageScore >= 80 ? "⭐" : "💫"}
                </span>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-teal-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                    <Zap className="h-5 w-5 text-pink-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Active Streak</p>
                    <p className="text-2xl font-bold text-pink-600">
                      {stats.engagementScore >= 80 ? "🔥" : stats.engagementScore >= 60 ? "⚡" : "✨"}
                    </p>
                  </div>
                </div>
                <span className="text-3xl">🎯</span>
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
                {courseProgress.map((course, index) => {
                  const statusColors = {
                    completed: { bg: 'from-green-500 to-emerald-500', text: 'text-green-700', border: 'border-green-200', emoji: '✅' },
                    in_progress: { bg: 'from-orange-500 to-amber-500', text: 'text-orange-700', border: 'border-orange-200', emoji: '🔥' },
                    not_started: { bg: 'from-gray-400 to-gray-500', text: 'text-gray-700', border: 'border-gray-200', emoji: '📋' }
                  };
                  const colors = statusColors[course.status as keyof typeof statusColors] || statusColors.not_started;

                  return (
                    <div 
                      key={course.courseId} 
                      className={`p-5 rounded-xl border-2 ${colors.border} bg-gradient-to-r from-white to-${colors.bg.split(' ')[0].replace('from-', '')}-50/30 hover:shadow-lg transition-all`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start gap-3 flex-1">
                          <div className={`w-12 h-12 bg-gradient-to-br ${colors.bg} rounded-xl flex items-center justify-center shadow-md flex-shrink-0`}>
                            <span className="text-2xl">{colors.emoji}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-gray-900 mb-1">{course.courseName}</h4>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <Badge variant="outline" className={colors.border}>
                                {course.status === 'completed' ? 'Completed' : course.status === 'in_progress' ? 'In Progress' : 'Not Started'}
                              </Badge>
                              {course.score && (
                                <span className={`font-semibold ${colors.text}`}>
                                  Score: {course.score}%
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        {course.status === 'in_progress' && (
                          <Link href="/trainee/courses">
                            <Button size="sm" variant="default" className="gap-2">
                              <Play className="h-4 w-4" />
                              Continue
                            </Button>
                          </Link>
                        )}
                        {course.status === 'completed' && (
                          <Link href="/trainee/courses">
                            <Button size="sm" variant="outline" className="gap-2">
                              <CheckCircle className="h-4 w-4" />
                              Review
                            </Button>
                          </Link>
                        )}
                      </div>
                      
                      {course.status !== 'not_started' && (
                        <div className="mt-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-600">Progress</span>
                            <span className="text-sm font-bold text-gray-900">{course.progress}%</span>
                          </div>
                          <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className={`h-full bg-gradient-to-r ${colors.bg} rounded-full transition-all duration-500 shadow-sm`}
                              style={{ width: `${course.progress}%` }}
                            />
                          </div>
                        </div>
                      )}
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