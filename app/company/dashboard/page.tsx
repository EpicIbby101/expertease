import { createClient } from '@supabase/supabase-js';
import { RoleGate } from '../../../components/RoleGate';
import { getUserCompany } from '@/lib/auth';
import { auth } from '@clerk/nextjs/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import { Users, BookOpen, Award, TrendingUp, FileText, BarChart3, Activity, Settings, Target, User, MessageSquare } from 'lucide-react';
import { CompanyDashboardAnalytics } from '@/components/CompanyDashboardAnalytics';
import { CompanyTraineeManager } from '@/components/CompanyTraineeManager';
import CompanyTicketManager from '@/components/CompanyTicketManager';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function CompanyDashboard() {
  const userCompany = await getUserCompany();
  const { userId } = await auth();
  
  // Get current user details
  const { data: currentUser } = await supabase
    .from('users')
    .select('first_name, last_name, email')
    .eq('user_id', userId)
    .single();
  
  // Get company trainees
  const { data: trainees } = await supabase
    .from('users')
    .select('id, email, role')
    .eq('company_id', userCompany?.company_id)
    .eq('role', 'trainee');

  // Get company details
  const { data: companyDetails } = await supabase
    .from('companies')
    .select('*')
    .eq('id', userCompany?.company_id)
    .single();
  
  // Prepare personalized welcome message
  const displayName = currentUser?.first_name && currentUser?.last_name 
    ? `${currentUser.first_name} ${currentUser.last_name}`
    : currentUser?.first_name 
    ? currentUser.first_name
    : currentUser?.email || 'Admin';

  const stats = {
    totalTrainees: trainees?.length || 0,
    activeTrainees: trainees?.length || 0, // TODO: Add completion status
    completedCourses: 0, // TODO: Add course completion tracking
    averageScore: 0, // TODO: Add score tracking
  };

  return (
    <RoleGate requiredRole="company_admin">
      <div className="space-y-6">
        {/* Enhanced Page Header */}
        <div className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-lg p-6 border border-blue-200/20">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-blue-600/20 rounded-full flex items-center justify-center">
                  <User className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-700">
                    Welcome back, {displayName.split(' ')[0]}!
                  </h1>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-gray-400 text-sm flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-400" />
                      {userCompany?.company_name || 'Your Company'}
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-gray-600 mt-2 ml-16">
                Manage your trainees, track progress, and oversee training programs
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-3 text-sm text-gray-300">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-400" />
                  <span className="font-medium text-gray-700">{stats.totalTrainees}</span>
                  <span className="text-gray-500">trainees</span>
                </div>
                <div className="h-4 w-px bg-gray-400"></div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-400" />
                  <span className="font-medium text-green-400">{stats.activeTrainees}</span>
                  <span className="text-gray-500">active</span>
                </div>
                <div className="h-4 w-px bg-gray-400"></div>
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-purple-400" />
                  <span className="font-medium text-purple-400">{stats.completedCourses}</span>
                  <span className="text-gray-500">completed</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs for Different Views */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Overview & Analytics
            </TabsTrigger>
            <TabsTrigger value="trainees" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Trainee Management
            </TabsTrigger>
            <TabsTrigger value="support" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Support Tickets
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Reports & Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <CompanyDashboardAnalytics 
              companyId={userCompany?.company_id || ''} 
              companyName={userCompany?.company_name || 'Your Company'} 
            />
          </TabsContent>

          <TabsContent value="trainees" className="space-y-6">
            <CompanyTraineeManager 
              companyId={userCompany?.company_id || ''} 
              companyName={userCompany?.company_name || 'Your Company'} 
            />
          </TabsContent>

          <TabsContent value="support" className="space-y-6">
            <CompanyTicketManager />
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            {/* Company Settings Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Company Information
                </CardTitle>
                <CardDescription>View and update your company details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Company Name</label>
                    <div className="text-gray-400 font-medium">{companyDetails?.name || 'N/A'}</div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-400">Company Slug</label>
                    <div className="text-gray-400 font-mono text-sm">{companyDetails?.slug || 'N/A'}</div>
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-sm font-medium text-gray-400">Description</label>
                    <div className="text-gray-400">{companyDetails?.description || 'No description provided.'}</div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-400">Max Trainees</label>
                    <div className="text-gray-400 font-medium">{companyDetails?.max_trainees || 'N/A'}</div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-400">Current Trainees</label>
                    <div className="text-gray-400 font-medium">{stats.totalTrainees} / {companyDetails?.max_trainees || 'N/A'}</div>
                  </div>
                </div>
                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-500">
                    💡 Need to update company settings? Contact your site administrator.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Coming Soon Features */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <Card className="hover:shadow-lg transition-all duration-200 hover:-translate-y-1 opacity-60">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-green-600" />
                    Progress Reports
                  </CardTitle>
                  <CardDescription>View detailed progress reports and analytics</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full" disabled>
                    Coming Soon
                  </Button>
                </CardContent>
              </Card>
              
              <Card className="hover:shadow-lg transition-all duration-200 hover:-translate-y-1 opacity-60">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-purple-600" />
                    Certificates
                  </CardTitle>
                  <CardDescription>Manage and issue training certificates</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full" disabled>
                    Coming Soon
                  </Button>
                </CardContent>
              </Card>
              
              <Card className="hover:shadow-lg transition-all duration-200 hover:-translate-y-1 opacity-60">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-orange-600" />
                    Achievements
                  </CardTitle>
                  <CardDescription>Track and award trainee achievements</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full" disabled>
                    Coming Soon
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </RoleGate>
  );
} 