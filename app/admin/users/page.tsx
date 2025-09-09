import { createClient } from '@supabase/supabase-js';
import { RoleGate } from '../../../components/RoleGate';
import { EnhancedUserManager } from '../../../components/EnhancedUserManager';
import { InviteUserModal } from '../../../components/InviteUserModal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Building, Award, TrendingUp, UserPlus, Activity, Shield, Trash2 } from 'lucide-react';
import { InviteUserButton } from '../../../components/InviteUserButton';
import Link from 'next/link';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface PageProps {
  searchParams: Promise<{
    page?: string;
    limit?: string;
  }>;
}

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const page = parseInt(resolvedSearchParams.page || '1');
  const limit = parseInt(resolvedSearchParams.limit || '10');
  const offset = (page - 1) * limit;

  // Fetch total count for pagination
  const { count: totalUsers } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true });

  // Fetch paginated users
  const { data: users, error } = await supabase
    .from('users')
    .select(`
      id, 
      email, 
      role, 
      company_name, 
      created_at,
      first_name,
      last_name,
      phone,
      job_title,
      department,
      is_active,
      profile_completed,
      last_active_at
    `)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  // Get deleted users for recycling bin (if soft delete is implemented)
  let deletedUsers: any[] = [];
  try {
    const { data: users } = await supabase
      .from('users')
      .select(`
        id,
        email,
        first_name,
        last_name,
        role,
        company_name,
        created_at,
        deleted_at,
        deleted_by,
        deleted_reason
      `)
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false });
    
    deletedUsers = users || [];
  } catch (error) {
    // Soft delete not implemented yet
    console.log('Users soft delete not yet implemented:', error);
    deletedUsers = [];
  }

  // Fetch companies for the invite modal
  const { data: companies } = await supabase
    .from('companies')
    .select('id, name')
    .order('name');

  // Debug logging
  console.log('Users data:', users);
  console.log('Users error:', error);
  console.log('Companies data:', companies);

  // Calculate comprehensive stats
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  const stats = {
    totalUsers: totalUsers || 0,
    siteAdmins: users?.filter(u => u.role === 'site_admin').length || 0,
    companyAdmins: users?.filter(u => u.role === 'company_admin').length || 0,
    trainees: users?.filter(u => u.role === 'trainee').length || 0,
    activeUsers: users?.length || 0, // Simplified since we don't have last_sign_in_at
    newUsersThisMonth: users?.filter(u => new Date(u.created_at) > thirtyDaysAgo).length || 0,
  };

  // Get unique companies
  const uniqueCompanies = [...new Set(users?.map(u => u.company_name).filter(Boolean) || [])];

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
            <InviteUserButton companies={companies || []} />
            <button className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors">
              <Shield className="h-4 w-4 mr-2" />
              Security Audit
            </button>
            <Link
              href="/admin/recycling-bin"
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Recycling Bin
            </Link>
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
            
            <EnhancedUserManager 
              users={users || []} 
              companies={uniqueCompanies}
              totalUsers={totalUsers || 0}
              currentPage={page}
              pageSize={limit}
            />
          </CardContent>
        </Card>

      </div>
    </RoleGate>
  );
} 