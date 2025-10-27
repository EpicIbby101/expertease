import { createClient } from '@supabase/supabase-js';
import { RoleGate } from '../../../components/RoleGate';
import { getUserCompany } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import { Users, BookOpen, Award, TrendingUp, FileText, BarChart3, Activity, Settings, Target } from 'lucide-react';
import { CompanyDashboardAnalytics } from '@/components/CompanyDashboardAnalytics';
import { CompanyTraineeManager } from '@/components/CompanyTraineeManager';

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
        {/* Enhanced Page Header */}
        <div className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-lg p-6 border border-blue-200/20">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <Users className="h-8 w-8" />
                Company Dashboard
              </h1>
              <p className="text-gray-400 mt-2">
                {userCompany?.company_name || 'Your Company'} - Comprehensive trainee management and analytics
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-3 text-sm text-gray-300">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-400" />
                  <span className="font-medium text-white">{stats.totalTrainees}</span>
                  <span>trainees</span>
                </div>
                <div className="h-4 w-px bg-gray-400"></div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-400" />
                  <span className="font-medium text-green-400">{stats.activeTrainees}</span>
                  <span>active</span>
                </div>
                <div className="h-4 w-px bg-gray-400"></div>
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-purple-400" />
                  <span className="font-medium text-purple-400">{stats.completedCourses}</span>
                  <span>completed</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs for Different Views */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Overview & Analytics
            </TabsTrigger>
            <TabsTrigger value="trainees" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Trainee Management
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

          <TabsContent value="reports" className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <Card className="hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
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
              
              <Card className="hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
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
              
              <Card className="hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-orange-600" />
                    Company Settings
                  </CardTitle>
                  <CardDescription>Configure your company preferences and settings</CardDescription>
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