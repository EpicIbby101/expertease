import { createClient } from '@supabase/supabase-js';
import { RoleGate } from '../../../components/RoleGate';
import { InvitationTracker } from '../../../components/InvitationTracker';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

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

export default async function AdminInvitationsPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const page = parseInt(resolvedSearchParams.page || '1');
  const limit = parseInt(resolvedSearchParams.limit || '10');
  const offset = (page - 1) * limit;

  // Fetch total count for pagination
  const { count: totalInvitations } = await supabase
    .from('invitations')
    .select('*', { count: 'exact', head: true });

  // Fetch paginated invitations with related data
  const { data: invitations, error } = await supabase
    .from('invitations')
    .select(`
      id,
      email,
      role,
      company_id,
      invited_by,
      status,
      token,
      expires_at,
      accepted_at,
      created_at,
      updated_at,
      user_data,
      companies(name),
      users!invitations_invited_by_fkey(first_name, last_name)
    `)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  // Transform the data to match our component interface
  const transformedInvitations = invitations?.map(inv => ({
    id: inv.id,
    email: inv.email,
    role: inv.role,
    company_id: inv.company_id,
    company_name: Array.isArray(inv.companies) && inv.companies[0]?.name ? inv.companies[0].name : null,
    invited_by: inv.invited_by,
    inviter_name: Array.isArray(inv.users) && inv.users[0] 
      ? `${inv.users[0].first_name || ''} ${inv.users[0].last_name || ''}`.trim() || 'Unknown' 
      : 'Unknown',
    status: inv.status,
    token: inv.token,
    expires_at: inv.expires_at,
    accepted_at: inv.accepted_at,
    created_at: inv.created_at,
    updated_at: inv.updated_at,
    user_data: inv.user_data
  })) || [];

  // Calculate stats
  const stats = {
    total: totalInvitations || 0,
    pending: transformedInvitations.filter(inv => inv.status === 'pending').length,
    accepted: transformedInvitations.filter(inv => inv.status === 'accepted').length,
    expired: transformedInvitations.filter(inv => inv.status === 'expired').length,
    cancelled: transformedInvitations.filter(inv => inv.status === 'cancelled').length,
  };

  return (
    <RoleGate requiredRole="site_admin">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Invitation Management</h1>
            <p className="text-gray-600 mt-1">Track and manage user invitations across the platform</p>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <Mail className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-gray-500">All invitations</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending}</div>
              <p className="text-xs text-gray-500">Awaiting response</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Accepted</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.accepted}</div>
              <p className="text-xs text-gray-500">Successfully joined</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expired</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.expired}</div>
              <p className="text-xs text-gray-500">Past expiry date</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cancelled</CardTitle>
              <XCircle className="h-4 w-4 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.cancelled}</div>
              <p className="text-xs text-gray-500">Admin cancelled</p>
            </CardContent>
          </Card>
        </div>

        {/* Invitation Tracker Component */}
        <InvitationTracker 
          invitations={transformedInvitations}
          totalInvitations={totalInvitations || 0}
          currentPage={page}
          pageSize={limit}
        />
      </div>
    </RoleGate>
  );
} 