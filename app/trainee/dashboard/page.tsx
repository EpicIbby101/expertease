import { RoleGate } from '../../../components/RoleGate';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { BookOpen, Award, Clock, CheckCircle, Play, Target } from 'lucide-react';

export default async function TraineeDashboard() {
  // TODO: Get actual trainee data from database
  const stats = {
    enrolledCourses: 0,
    completedCourses: 0,
    inProgressCourses: 0,
    averageScore: 0,
  };

  return (
    <RoleGate requiredRole="trainee">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Training Dashboard</h1>
            <p className="text-gray-600 mt-1">Track your progress and continue your learning journey</p>
          </div>
          <Button asChild size="lg">
            <Link href="/trainee/courses" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Browse Courses
            </Link>
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Enrolled Courses</CardTitle>
              <BookOpen className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.enrolledCourses}</div>
              <p className="text-xs text-gray-500 mt-1">Total courses</p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.completedCourses}</div>
              <p className="text-xs text-gray-500 mt-1">Finished courses</p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">In Progress</CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.inProgressCourses}</div>
              <p className="text-xs text-gray-500 mt-1">Currently learning</p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Average Score</CardTitle>
              <Award className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.averageScore}%</div>
              <p className="text-xs text-gray-500 mt-1">Your performance</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
            <CardHeader>
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-blue-600" />
                <CardTitle>Available Courses</CardTitle>
              </div>
              <CardDescription>Browse and enroll in new training courses</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/trainee/courses">Browse Courses</Link>
              </Button>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-green-600" />
                <CardTitle>My Progress</CardTitle>
              </div>
              <CardDescription>Track your learning progress and achievements</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-purple-600" />
                <CardTitle>Certificates</CardTitle>
              </div>
              <CardDescription>View and download your earned certificates</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Welcome Message */}
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Play className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-blue-900">Welcome to Expert Ease Training</CardTitle>
                <CardDescription className="text-blue-700">Start your learning journey today</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-blue-800">
                You're all set up! Browse our available courses to start your training.
                Track your progress and earn certificates as you complete modules.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button asChild className="bg-blue-600 hover:bg-blue-700">
                  <Link href="/trainee/courses">Get Started</Link>
                </Button>
                <Button variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-50">
                  View Tutorial
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Tips */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Tips</CardTitle>
            <CardDescription>Make the most of your training experience</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-blue-600">1</span>
                </div>
                <div>
                  <p className="text-sm font-medium">Complete modules regularly</p>
                  <p className="text-xs text-gray-600">Consistent learning leads to better retention</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-green-600">2</span>
                </div>
                <div>
                  <p className="text-sm font-medium">Take practice quizzes</p>
                  <p className="text-xs text-gray-600">Test your knowledge to reinforce learning</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </RoleGate>
  );
} 