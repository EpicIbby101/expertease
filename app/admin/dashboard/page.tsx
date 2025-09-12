import { createClient } from '@supabase/supabase-js';
import { RoleGate } from '../../../components/RoleGate';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Mail, Building, TrendingUp, Clock, CheckCircle, XCircle, AlertCircle, Shield, Activity, AlertTriangle, TrendingDown, ArrowUpRight, ArrowDownRight, Settings } from 'lucide-react';
import Link from 'next/link';
import { FixCompanyNamesButton } from './_components/FixCompanyNamesButton';

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

  // Fetch trend data (last 30 days vs previous 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

  // User growth trends
  const { count: recentUsers } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', thirtyDaysAgo.toISOString());

  const { count: previousUsers } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', sixtyDaysAgo.toISOString())
    .lt('created_at', thirtyDaysAgo.toISOString());

  // Company growth trends
  const { count: recentCompanies } = await supabase
    .from('companies')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', thirtyDaysAgo.toISOString());

  const { count: previousCompanies } = await supabase
    .from('companies')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', sixtyDaysAgo.toISOString())
    .lt('created_at', thirtyDaysAgo.toISOString());

  // Security metrics
  const { data: securityData } = await supabase
    .from('audit_logs')
    .select('severity')
    .gte('created_at', thirtyDaysAgo.toISOString());

  const criticalSecurityEvents = securityData?.filter(log => log.severity === 'critical').length || 0;
  const warningSecurityEvents = securityData?.filter(log => log.severity === 'warning').length || 0;

  // Recent activity
  const { data: recentActivity } = await supabase
    .from('audit_logs')
    .select('action, created_at, user_id, resource_type')
    .order('created_at', { ascending: false })
    .limit(5);

  // Calculate growth percentages
  const userGrowthPercent = (previousUsers || 0) > 0 ? Math.round(((recentUsers || 0) - (previousUsers || 0)) / (previousUsers || 0) * 100) : 0;
  const companyGrowthPercent = (previousCompanies || 0) > 0 ? Math.round(((recentCompanies || 0) - (previousCompanies || 0)) / (previousCompanies || 0) * 100) : 0;

  // Helper function to get growth indicator
  const getGrowthIndicator = (percent: number) => {
    if (percent > 0) return { icon: ArrowUpRight, color: 'text-green-600', bg: 'bg-green-50' };
    if (percent < 0) return { icon: ArrowDownRight, color: 'text-red-600', bg: 'bg-red-50' };
    return { icon: TrendingUp, color: 'text-gray-600', bg: 'bg-gray-50' };
  };

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

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Link href="/admin/users">
                <Card className="hover:shadow-md transition-shadow cursor-pointer group">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <Users className="h-5 w-5 text-blue-600 group-hover:text-blue-700" />
                      <span className="text-sm font-medium">Manage Users</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">View and manage user accounts</p>
                    <div className="mt-2 flex items-center space-x-1">
                      <span className="text-xs text-blue-600 font-medium">{totalUsers || 0} total</span>
                      <ArrowUpRight className="h-3 w-3 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/admin/invitations">
                <Card className="hover:shadow-md transition-shadow cursor-pointer group">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <Mail className="h-5 w-5 text-purple-600 group-hover:text-purple-700" />
                      <span className="text-sm font-medium">Track Invitations</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Monitor invitation status</p>
                    <div className="mt-2 flex items-center space-x-1">
                      <span className={`text-xs font-medium ${pendingInvitations > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                        {pendingInvitations} pending
                      </span>
                      <ArrowUpRight className="h-3 w-3 text-purple-600" />
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/admin/companies">
                <Card className="hover:shadow-md transition-shadow cursor-pointer group">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <Building className="h-5 w-5 text-green-600 group-hover:text-green-700" />
                      <span className="text-sm font-medium">Manage Companies</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Company administration</p>
                    <div className="mt-2 flex items-center space-x-1">
                      <span className="text-xs text-green-600 font-medium">{totalCompanies || 0} registered</span>
                      <ArrowUpRight className="h-3 w-3 text-green-600" />
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/admin/analytics">
                <Card className="hover:shadow-md transition-shadow cursor-pointer group">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-5 w-5 text-orange-600 group-hover:text-orange-700" />
                      <span className="text-sm font-medium">Analytics</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Platform insights and trends</p>
                    <div className="mt-2 flex items-center space-x-1">
                      <span className="text-xs text-orange-600 font-medium">View reports</span>
                      <ArrowUpRight className="h-3 w-3 text-orange-600" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
            
            {/* Context-Aware Actions */}
            {pendingInvitations > 0 && (
              <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-medium text-orange-800">Action Required</span>
                </div>
                <p className="text-sm text-orange-700 mb-3">
                  You have {pendingInvitations} pending invitation{pendingInvitations > 1 ? 's' : ''} that require attention.
                </p>
                <Link 
                  href="/admin/invitations"
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-orange-700 bg-orange-100 border border-orange-300 rounded-md hover:bg-orange-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors"
                >
                  Review Invitations
                  <ArrowUpRight className="h-3 w-3 ml-1" />
                </Link>
              </div>
            )}

            {criticalSecurityEvents > 0 && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Shield className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-medium text-red-800">Security Alert</span>
                </div>
                <p className="text-sm text-red-700 mb-3">
                  {criticalSecurityEvents} critical security event{criticalSecurityEvents > 1 ? 's' : ''} detected.
                </p>
                <Link 
                  href="/admin/security-audit"
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-red-700 bg-red-100 border border-red-300 rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                >
                  Review Security Issues
                  <ArrowUpRight className="h-3 w-3 ml-1" />
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Enhanced Quick Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="hover:shadow-md transition-shadow border-l-4 border-l-blue-500 relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Total Users</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{totalUsers || 0}</div>
              <div className="flex items-center space-x-2 mt-2">
                <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${getGrowthIndicator(userGrowthPercent).bg}`}>
                  {(() => {
                    const indicator = getGrowthIndicator(userGrowthPercent);
                    const IconComponent = indicator.icon;
                    return <IconComponent className={`h-3 w-3 ${indicator.color}`} />;
                  })()}
                  <span className={`text-xs font-medium ${getGrowthIndicator(userGrowthPercent).color}`}>
                    {Math.abs(userGrowthPercent)}% vs last month
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">{recentUsers || 0} new this month</p>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-md transition-shadow border-l-4 border-l-purple-500 relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Total Invitations</CardTitle>
              <Mail className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{totalInvitations || 0}</div>
              <div className="flex items-center space-x-2 mt-2">
                <div className="flex items-center space-x-1 px-2 py-1 rounded-full text-xs bg-blue-50">
                  <CheckCircle className="h-3 w-3 text-blue-600" />
                  <span className="text-xs font-medium text-blue-600">
                    {acceptedInvitations} accepted
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">{acceptedInvitations > 0 ? `${Math.round((acceptedInvitations / (totalInvitations || 1)) * 100)}% success rate` : 'No accepted invitations yet'}</p>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-md transition-shadow border-l-4 border-l-green-500 relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Total Companies</CardTitle>
              <Building className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{totalCompanies || 0}</div>
              <div className="flex items-center space-x-2 mt-2">
                <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${getGrowthIndicator(companyGrowthPercent).bg}`}>
                  {(() => {
                    const indicator = getGrowthIndicator(companyGrowthPercent);
                    const IconComponent = indicator.icon;
                    return <IconComponent className={`h-3 w-3 ${indicator.color}`} />;
                  })()}
                  <span className={`text-xs font-medium ${getGrowthIndicator(companyGrowthPercent).color}`}>
                    {Math.abs(companyGrowthPercent)}% vs last month
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">{recentCompanies || 0} new this month</p>
            </CardContent>
          </Card>
          
          <Card className={`hover:shadow-md transition-shadow border-l-4 ${pendingInvitations > 0 ? 'border-l-orange-500' : 'border-l-green-500'} relative overflow-hidden`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Pending Invitations</CardTitle>
              <Clock className={`h-4 w-4 ${pendingInvitations > 0 ? 'text-orange-600' : 'text-green-600'}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{pendingInvitations}</div>
              <div className="flex items-center space-x-2 mt-2">
                <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${pendingInvitations > 0 ? 'bg-orange-50' : 'bg-green-50'}`}>
                  <AlertTriangle className={`h-3 w-3 ${pendingInvitations > 0 ? 'text-orange-600' : 'text-green-600'}`} />
                  <span className={`text-xs font-medium ${pendingInvitations > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                    {pendingInvitations > 0 ? 'Action needed' : 'All processed'}
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">{pendingInvitations > 0 ? 'Requires attention' : 'No pending invitations'}</p>
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

        {/* Security & Activity Overview */}
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Security Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-red-600" />
                Security Status
              </CardTitle>
              <CardDescription>Recent security events and alerts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Critical Events</span>
                <div className="flex items-center space-x-2">
                  <span className={`text-sm font-medium ${criticalSecurityEvents > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {criticalSecurityEvents}
                  </span>
                  {criticalSecurityEvents > 0 && <AlertTriangle className="h-4 w-4 text-red-600" />}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Warning Events</span>
                <span className={`text-sm font-medium ${warningSecurityEvents > 0 ? 'text-orange-600' : 'text-gray-600'}`}>
                  {warningSecurityEvents}
                </span>
              </div>
              <div className="pt-2">
                <Link 
                  href="/admin/security-audit"
                  className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  View Security Audit
                  <ArrowUpRight className="h-3 w-3 ml-1" />
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-600" />
                Recent Activity
              </CardTitle>
              <CardDescription>Latest platform activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivity && recentActivity.length > 0 ? (
                  recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center space-x-3 text-sm">
                      <div className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full"></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white truncate">
                          {activity.action.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                        </p>
                        <p className="text-gray-500 text-xs">
                          {activity.resource_type} • {new Date(activity.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <Activity className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No recent activity</p>
                  </div>
                )}
              </div>
              <div className="pt-2">
                <Link 
                  href="/admin/audit-logs"
                  className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  View All Activity
                  <ArrowUpRight className="h-3 w-3 ml-1" />
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Maintenance Tools */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-orange-600" />
              Maintenance Tools
            </CardTitle>
            <CardDescription>System maintenance and data fixes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-200">
                <div>
                  <h4 className="font-medium text-orange-900">Fix Company Names</h4>
                  <p className="text-sm text-orange-700 mt-1">
                    Update existing users who have company_id but missing company_name
                  </p>
                </div>
                <FixCompanyNamesButton />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bottom spacing for visual completion */}
        <div className="h-8"></div>
      </div>
    </RoleGate>
  );
} 