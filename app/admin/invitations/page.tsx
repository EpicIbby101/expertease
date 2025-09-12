import { createClient } from '@supabase/supabase-js';
import { RoleGate } from '../../../components/RoleGate';
import { InvitationTracker } from '../../../components/InvitationTracker';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Clock, CheckCircle, XCircle, AlertCircle, UserPlus, Download, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Invitations</h1>
            <p className="text-gray-600 mt-1">Track and manage user invitations across the platform</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-500">
                <span className="font-medium text-gray-900">{stats.total}</span> total
              </div>
              <div className="h-4 w-px bg-gray-300"></div>
              <div className="text-sm text-gray-500">
                <span className="font-medium text-yellow-600">{stats.pending}</span> pending
              </div>
              <div className="h-4 w-px bg-gray-300"></div>
              <div className="text-sm text-gray-500">
                <span className="font-medium text-green-600">{stats.accepted}</span> accepted
              </div>
            </div>
            <div className="flex gap-2">
              <Link href="/admin/users">
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Invite User
                </Button>
              </Link>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
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