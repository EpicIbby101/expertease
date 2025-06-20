import { createClient } from '@supabase/supabase-js';
import { RoleGate } from '../../../components/RoleGate';
import { getUserCompany } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Users, BookOpen, Award, TrendingUp, FileText, BarChart3 } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function CompanyDashboard() {
  const userCompany = await getUserCompany();
  
  // Get company trainees
  const { data: trainees } = await supabase
    .from('users')
    .select('id, email, role')
    .eq('company_id', userCompany?.company_id)
    .eq('role', 'trainee');

  const stats = {
    totalTrainees: trainees?.length || 0,
    activeTrainees: trainees?.length || 0, // TODO: Add completion status
    completedCourses: 0, // TODO: Add course completion tracking
    averageScore: 0, // TODO: Add score tracking
  };

  return (
    <RoleGate requiredRole="company_admin">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Company Dashboard
            </h1>
            <p className="text-gray-600 mt-1">
              {userCompany?.company_name || 'Your Company'} - Manage your trainees and track progress
            </p>
          </div>
          <Button asChild size="lg">
            <Link href="/company/trainees" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Manage Trainees
            </Link>
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Total Trainees</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.totalTrainees}</div>
              <p className="text-xs text-gray-500 mt-1">Company trainees</p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Active Trainees</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.activeTrainees}</div>
              <p className="text-xs text-gray-500 mt-1">Currently training</p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Completed Courses</CardTitle>
              <BookOpen className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.completedCourses}</div>
              <p className="text-xs text-gray-500 mt-1">Total completions</p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Average Score</CardTitle>
              <Award className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.averageScore}%</div>
              <p className="text-xs text-gray-500 mt-1">Company average</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                <CardTitle>Trainee Management</CardTitle>
              </div>
              <CardDescription>Manage your company's trainees and their progress</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link href="/company/trainees">Manage Trainees</Link>
              </Button>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
            <CardHeader>
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-green-600" />
                <CardTitle>Progress Reports</CardTitle>
              </div>
              <CardDescription>View detailed progress reports and analytics</CardDescription>
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
                <FileText className="h-5 w-5 text-purple-600" />
                <CardTitle>Certificates</CardTitle>
              </div>
              <CardDescription>Manage and issue training certificates</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Trainees */}
        {trainees && trainees.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Recent Trainees</CardTitle>
              <CardDescription>Your company's active trainees</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {trainees.slice(0, 5).map((trainee) => (
                  <div key={trainee.id} className="flex items-center justify-between p-3 rounded-lg border bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{trainee.email}</p>
                        <p className="text-xs text-gray-500">Trainee</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      View Progress
                    </Button>
                  </div>
                ))}
                {trainees.length > 5 && (
                  <div className="text-center pt-2">
                    <Button variant="outline" size="sm">
                      View All {trainees.length} Trainees
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {(!trainees || trainees.length === 0) && (
          <Card>
            <CardHeader>
              <CardTitle>No Trainees Yet</CardTitle>
              <CardDescription>Get started by adding trainees to your company</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">You haven't added any trainees yet.</p>
                <Button asChild>
                  <Link href="/company/trainees">Add Your First Trainee</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </RoleGate>
  );
} 