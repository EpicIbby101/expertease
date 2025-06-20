import { createClient } from '@supabase/supabase-js';
import { RoleGate } from '../../../components/RoleGate';
import { UserRoleManager } from '../../../components/UserRoleManager';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Building, Award, TrendingUp } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function AdminUsersPage() {
  const { data: users } = await supabase
    .from('users')
    .select('id, email, role, company_name, created_at')
    .order('created_at', { ascending: false });

  // Calculate stats
  const stats = {
    totalUsers: users?.length || 0,
    siteAdmins: users?.filter(u => u.role === 'site_admin').length || 0,
    companyAdmins: users?.filter(u => u.role === 'company_admin').length || 0,
    trainees: users?.filter(u => u.role === 'trainee').length || 0,
  };

  return (
    <RoleGate requiredRole="site_admin">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">User Management</h1>
            <p className="text-gray-600 mt-1">Manage all users across the platform</p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-900">Total Users</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats.totalUsers}</div>
              <p className="text-xs text-gray-500 mt-1">All registered users</p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-900">Site Admins</CardTitle>
              <Award className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats.siteAdmins}</div>
              <p className="text-xs text-gray-500 mt-1">System administrators</p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-900">Company Admins</CardTitle>
              <Building className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats.companyAdmins}</div>
              <p className="text-xs text-gray-500 mt-1">Company administrators</p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-900">Trainees</CardTitle>
              <TrendingUp className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats.trainees}</div>
              <p className="text-xs text-gray-500 mt-1">Active trainees</p>
            </CardContent>
          </Card>
        </div>

        {/* User Management Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Users</CardTitle>
            <CardDescription>Manage user roles and permissions across the platform</CardDescription>
          </CardHeader>
          <CardContent>
            <UserRoleManager users={users || []} />
          </CardContent>
        </Card>
      </div>
    </RoleGate>
  );
} 