import { createClient } from '@supabase/supabase-js';
import { RoleGate } from '../../../components/RoleGate';
import { EnhancedUserManager } from '../../../components/EnhancedUserManager';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Building, Award, TrendingUp, UserPlus, Activity, Shield } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function AdminUsersPage() {
  const { data: users, error } = await supabase
    .from('users')
    .select('id, email, role, company_name, created_at')
    .order('created_at', { ascending: false });

  // Debug logging
  console.log('Users data:', users);
  console.log('Users error:', error);

  // Calculate comprehensive stats
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  const stats = {
    totalUsers: users?.length || 0,
    siteAdmins: users?.filter(u => u.role === 'site_admin').length || 0,
    companyAdmins: users?.filter(u => u.role === 'company_admin').length || 0,
    trainees: users?.filter(u => u.role === 'trainee').length || 0,
    activeUsers: users?.length || 0, // Simplified since we don't have last_sign_in_at
    newUsersThisMonth: users?.filter(u => new Date(u.created_at) > thirtyDaysAgo).length || 0,
  };

  // Get unique companies
  const companies = [...new Set(users?.map(u => u.company_name).filter(Boolean) || [])];

  return (
    <RoleGate requiredRole="site_admin">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">User Management</h1>
            <p className="text-gray-600 mt-1">Comprehensive user administration and role management</p>
          </div>
          <div className="flex gap-2">
            <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
              <UserPlus className="h-4 w-4 mr-2" />
              Invite User
            </button>
            <button className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors">
              <Shield className="h-4 w-4 mr-2" />
              Security Audit
            </button>
          </div>
        </div>

        {/* Enhanced Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="hover:shadow-md transition-shadow border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Total Users</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.totalUsers}</div>
              <p className="text-xs text-gray-500 mt-1">All registered users</p>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-md transition-shadow border-l-4 border-l-purple-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Site Admins</CardTitle>
              <Award className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.siteAdmins}</div>
              <p className="text-xs text-gray-500 mt-1">System administrators</p>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-md transition-shadow border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Company Admins</CardTitle>
              <Building className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.companyAdmins}</div>
              <p className="text-xs text-gray-500 mt-1">Company administrators</p>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-md transition-shadow border-l-4 border-l-orange-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Trainees</CardTitle>
              <TrendingUp className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.trainees}</div>
              <p className="text-xs text-gray-500 mt-1">Active trainees</p>
            </CardContent>
          </Card>
        </div>

        {/* Additional Stats Row */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="hover:shadow-md transition-shadow border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Active Users (30d)</CardTitle>
              <Activity className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.activeUsers}</div>
              <p className="text-xs text-gray-500 mt-1">Users active in last 30 days</p>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-md transition-shadow border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">New Users (30d)</CardTitle>
              <UserPlus className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.newUsersThisMonth}</div>
              <p className="text-xs text-gray-500 mt-1">Users registered this month</p>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced User Management Table */}
        <Card>
          <CardHeader>
            <CardTitle>User Management</CardTitle>
            <CardDescription>
              Manage user roles, permissions, and account status. Site admins cannot downgrade their own role.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-800 font-medium">Database Error:</p>
                <p className="text-red-600 text-sm">{error.message}</p>
              </div>
            )}
            
            {users && users.length === 0 && (
              <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-yellow-800 font-medium">No Users Found</p>
                <p className="text-yellow-600 text-sm">The users table appears to be empty or the query returned no results.</p>
              </div>
            )}
            
            <EnhancedUserManager users={users || []} companies={companies} />
          </CardContent>
        </Card>
      </div>
    </RoleGate>
  );
} 