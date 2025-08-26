import { createClient } from '@supabase/supabase-js';
import { RoleGate } from '../../../components/RoleGate';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Mail, Building, TrendingUp, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function AdminDashboardPage() {
  // Fetch basic stats
  const { count: totalUsers } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true });

  const { count: totalInvitations } = await supabase
    .from('invitations')
    .select('*', { count: 'exact', head: true });

  const { count: totalCompanies } = await supabase
    .from('companies')
    .select('*', { count: 'exact', head: true });

  // Fetch invitation status counts
  const { data: invitationStats } = await supabase
    .from('invitations')
    .select('status');

  const pendingInvitations = invitationStats?.filter(inv => inv.status === 'pending').length || 0;
  const acceptedInvitations = invitationStats?.filter(inv => inv.status === 'accepted').length || 0;
  const expiredInvitations = invitationStats?.filter(inv => inv.status === 'expired').length || 0;

  // Fetch user role counts
  const { data: userStats } = await supabase
    .from('users')
    .select('role');

  const siteAdmins = userStats?.filter(user => user.role === 'site_admin').length || 0;
  const companyAdmins = userStats?.filter(user => user.role === 'company_admin').length || 0;
  const trainees = userStats?.filter(user => user.role === 'trainee').length || 0;

  return (
    <RoleGate requiredRole="site_admin">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-1">Overview of platform statistics and quick actions</p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="hover:shadow-md transition-shadow border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Total Users</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{totalUsers || 0}</div>
              <p className="text-xs text-gray-500 mt-1">All registered users</p>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-md transition-shadow border-l-4 border-l-purple-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Total Invitations</CardTitle>
              <Mail className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{totalInvitations || 0}</div>
              <p className="text-xs text-gray-500 mt-1">All time invitations</p>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-md transition-shadow border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Total Companies</CardTitle>
              <Building className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{totalCompanies || 0}</div>
              <p className="text-xs text-gray-500 mt-1">Registered companies</p>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-md transition-shadow border-l-4 border-l-orange-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Pending Invitations</CardTitle>
              <Clock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{pendingInvitations}</div>
              <p className="text-xs text-gray-500 mt-1">Awaiting response</p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Stats */}
        <div className="grid gap-4 sm:grid-cols-2">
          {/* User Roles Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>User Roles Distribution</CardTitle>
              <CardDescription>Breakdown of users by role</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Site Admins</span>
                <span className="text-sm font-medium">{siteAdmins}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Company Admins</span>
                <span className="text-sm font-medium">{companyAdmins}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Trainees</span>
                <span className="text-sm font-medium">{trainees}</span>
              </div>
            </CardContent>
          </Card>

          {/* Invitation Status Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Invitation Status</CardTitle>
              <CardDescription>Current invitation states</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Pending</span>
                <span className="text-sm font-medium text-yellow-600">{pendingInvitations}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Accepted</span>
                <span className="text-sm font-medium text-green-600">{acceptedInvitations}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Expired</span>
                <span className="text-sm font-medium text-red-600">{expiredInvitations}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Link href="/admin/users">
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <Users className="h-5 w-5 text-blue-600" />
                      <span className="text-sm font-medium">Manage Users</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">View and manage user accounts</p>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/admin/invitations">
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <Mail className="h-5 w-5 text-purple-600" />
                      <span className="text-sm font-medium">Track Invitations</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Monitor invitation status</p>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/admin/companies">
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <Building className="h-5 w-5 text-green-600" />
                      <span className="text-sm font-medium">Manage Companies</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Company administration</p>
                  </CardContent>
                </Card>
              </Link>

              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5 text-orange-600" />
                    <span className="text-sm font-medium">Analytics</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Platform insights (Coming soon)</p>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    </RoleGate>
  );
} 