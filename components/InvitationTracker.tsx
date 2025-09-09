'use client';

import { useState, useMemo } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Search, Filter, Clock, CheckCircle, XCircle, AlertCircle, RefreshCw, Trash2, Eye, Mail, Calendar, UserPlus, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingButton } from '@/components/ui/loading-button';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { Skeleton } from '@/components/ui/skeleton';
import { SmoothLoadingWrapper } from '@/components/ui/smooth-loading-wrapper';
import { toast } from 'sonner';
import { useRouter, useSearchParams } from 'next/navigation';

interface User {
  id: string;
  email: string;
  role: string;
  company_name?: string;
  created_at: string;
  // New fields (optional for now)
  first_name?: string;
  last_name?: string;
  phone?: string;
  job_title?: string;
  department?: string;
  is_active?: boolean;
  profile_completed?: boolean;
  last_active_at?: string;
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  company_id?: string;
  company_name?: string;
  invited_by: string;
  inviter_name?: string;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  token: string;
  expires_at: string;
  accepted_at?: string;
  created_at: string;
  updated_at: string;
  user_data?: {
    first_name?: string;
    last_name?: string;
    phone?: string;
    job_title?: string;
    department?: string;
    location?: string;
  };
}

interface EnhancedUserManagerProps {
  users: User[];
  companies: string[];
  totalUsers: number;
  currentPage: number;
  pageSize: number;
}

interface InvitationTrackerProps {
  invitations: Invitation[];
  totalInvitations: number;
  currentPage: number;
  pageSize: number;
  isLoading?: boolean;
}

export function InvitationTracker({ invitations, totalInvitations, currentPage, pageSize, isLoading = false }: InvitationTrackerProps) {
  const { userId } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [companyFilter, setCompanyFilter] = useState<string>('all');
  const [updating, setUpdating] = useState<string | null>(null);
  const [selectedInvitations, setSelectedInvitations] = useState<Set<string>>(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Calculate pagination values
  const totalPages = Math.ceil(totalInvitations / pageSize);
  const startInvitation = (currentPage - 1) * pageSize + 1;
  const endInvitation = Math.min(currentPage * pageSize, totalInvitations);

  // Filter invitations based on search and filters
  const filteredInvitations = useMemo(() => {
    return invitations.filter(invitation => {
      const matchesSearch = invitation.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (invitation.user_data?.first_name && invitation.user_data.first_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                           (invitation.user_data?.last_name && invitation.user_data.last_name.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus = statusFilter === 'all' || invitation.status === statusFilter;
      const matchesRole = roleFilter === 'all' || invitation.role === roleFilter;
      const matchesCompany = companyFilter === 'all' || invitation.company_name === companyFilter;
      
      return matchesSearch && matchesStatus && matchesRole && matchesCompany;
    });
  }, [invitations, searchTerm, statusFilter, roleFilter, companyFilter]);

  // Get unique companies for filter
  const uniqueCompanies = useMemo(() => {
    return [...new Set((invitations || []).map(inv => inv.company_name).filter(Boolean))];
  }, [invitations]);

  // Navigation functions
  const navigateToPage = (page: number) => {
    const params = new URLSearchParams();
    params.set('page', page.toString());
    params.set('limit', pageSize.toString());
    router.push(`?${params.toString()}`);
  };

  // Refresh function
  const refreshInvitations = async () => {
    setIsRefreshing(true);
    try {
      // Use router.refresh() to trigger a server-side refresh of the current route
      router.refresh();
      toast.success('Invitations refreshed successfully');
    } catch (error) {
      console.error('Error refreshing invitations:', error);
      toast.error('Failed to refresh invitations');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Action functions
  const resendInvitation = async (invitationId: string) => {
    setUpdating(invitationId);
    try {
      const response = await fetch('/api/admin/resend-invitation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invitationId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to resend invitation');
      }
      
      toast.success('Invitation resent successfully');
      // Refresh the invitations data instead of reloading the page
      refreshInvitations();
    } catch (error) {
      console.error('Error resending invitation:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to resend invitation');
    } finally {
      setUpdating(null);
    }
  };

  const cancelInvitation = async (invitationId: string) => {
    setUpdating(invitationId);
    try {
      const response = await fetch('/api/admin/cancel-invitation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invitationId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to cancel invitation');
      }
      
      toast.success('Invitation cancelled successfully');
      // Refresh the invitations data instead of reloading the page
      refreshInvitations();
    } catch (error) {
      console.error('Error cancelling invitation:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to cancel invitation');
    } finally {
      setUpdating(null);
    }
  };

  const deleteInvitation = async (invitationId: string) => {
    if (!confirm('Are you sure you want to permanently delete this invitation? This action cannot be undone.')) {
      return;
    }

    setUpdating(invitationId);
    try {
      const response = await fetch('/api/admin/delete-invitation', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invitationId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete invitation');
      }
      
      toast.success('Invitation deleted successfully');
      // Refresh the invitations data instead of reloading the page
      refreshInvitations();
    } catch (error) {
      console.error('Error deleting invitation:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete invitation');
    } finally {
      setUpdating(null);
    }
  };

  // Bulk actions
  const toggleInvitationSelection = (invitationId: string) => {
    const newSelected = new Set(selectedInvitations);
    if (newSelected.has(invitationId)) {
      newSelected.delete(invitationId);
    } else {
      newSelected.add(invitationId);
    }
    setSelectedInvitations(newSelected);
  };

  const selectAllInvitations = () => {
            setSelectedInvitations(new Set((filteredInvitations || []).map(inv => inv.id)));
  };

  const clearSelection = () => {
    setSelectedInvitations(new Set());
  };

  const bulkResendInvitations = async () => {
    if (selectedInvitations.size === 0) {
      toast.error('No invitations selected');
      return;
    }

    setUpdating('bulk');
    try {
      const promises = Array.from(selectedInvitations || []).map(invitationId => 
        fetch('/api/admin/resend-invitation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ invitationId }),
        })
      );

      await Promise.all(promises);
      toast.success(`Resent ${selectedInvitations.size} invitations successfully`);
      // Refresh the invitations data instead of reloading the page
      refreshInvitations();
    } catch (error) {
      console.error('Error in bulk resend:', error);
      toast.error('Failed to resend some invitations');
    } finally {
      setUpdating(null);
    }
  };

  const bulkCancelInvitations = async () => {
    if (selectedInvitations.size === 0) {
      toast.error('No invitations selected');
      return;
    }

    if (!confirm(`Are you sure you want to cancel ${selectedInvitations.size} invitations?`)) {
      return;
    }

    setUpdating('bulk');
    try {
      const promises = Array.from(selectedInvitations || []).map(invitationId => 
        fetch('/api/admin/cancel-invitation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ invitationId }),
        })
      );

      await Promise.all(promises);
      toast.success(`Cancelled ${selectedInvitations.size} invitations successfully`);
      // Refresh the invitations data instead of reloading the page
      refreshInvitations();
    } catch (error) {
      console.error('Error in bulk cancel:', error);
      toast.error('Failed to cancel some invitations');
    } finally {
      setUpdating(null);
    }
  };

  // Utility functions
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="default" className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'accepted':
        return <Badge variant="default" className="bg-green-100 text-green-800">Accepted</Badge>;
      case 'expired':
        return <Badge variant="secondary" className="bg-red-100 text-red-800">Expired</Badge>;
      case 'cancelled':
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'site_admin':
        return <Badge variant="outline" className="bg-purple-100 text-purple-800">Site Admin</Badge>;
      case 'company_admin':
        return <Badge variant="outline" className="bg-green-100 text-green-800">Company Admin</Badge>;
      case 'trainee':
        return <Badge variant="outline" className="bg-orange-100 text-orange-800">Trainee</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  const getTimeUntilExpiry = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h`;
    return '< 1h';
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">Invitation Management</h2>
          <p className="text-gray-600 mt-1">Track and manage user invitations across the platform</p>
        </div>
        <div className="flex gap-2">
          <LoadingButton 
            variant="outline" 
            size="sm" 
            onClick={refreshInvitations}
            loading={isRefreshing}
            loadingText="Refreshing..."
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </LoadingButton>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invitations</CardTitle>
            <Mail className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalInvitations}</div>
            <p className="text-xs text-gray-500">All time</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{invitations?.filter(inv => inv.status === 'pending')?.length || 0}</div>
            <p className="text-xs text-gray-500">Awaiting response</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accepted</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{invitations?.filter(inv => inv.status === 'accepted')?.length || 0}</div>
            <p className="text-xs text-gray-500">Successfully joined</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expired</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{invitations?.filter(inv => inv.status === 'expired')?.length || 0}</div>
            <p className="text-xs text-gray-500">Past expiry date</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search by email or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <select 
          value={statusFilter} 
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-[160px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="accepted">Accepted</option>
          <option value="expired">Expired</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <select 
          value={roleFilter} 
          onChange={(e) => setRoleFilter(e.target.value)}
          className="w-[160px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Roles</option>
          <option value="site_admin">Site Admin</option>
          <option value="company_admin">Company Admin</option>
          <option value="trainee">Trainee</option>
        </select>

        <select 
          value={companyFilter} 
          onChange={(e) => setCompanyFilter(e.target.value)}
          className="w-[180px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Companies</option>
                      {(uniqueCompanies || []).map(company => (
            <option key={company} value={company}>{company}</option>
          ))}
        </select>
      </div>

      {/* Bulk Actions */}
      {selectedInvitations.size > 0 && (
        <div className="flex items-center gap-2 p-4 bg-blue-50 rounded-lg">
          <span className="text-sm text-blue-800">
            {selectedInvitations.size} invitation{selectedInvitations.size !== 1 ? 's' : ''} selected
          </span>
          <Button
            onClick={bulkResendInvitations}
            size="sm"
            variant="outline"
            disabled={updating === 'bulk'}
          >
            <Mail className="h-4 w-4 mr-1" />
            Resend Selected
          </Button>
          <Button
            onClick={bulkCancelInvitations}
            size="sm"
            variant="outline"
            disabled={updating === 'bulk'}
          >
            <XCircle className="h-4 w-4 mr-1" />
            Cancel Selected
          </Button>
          <Button onClick={clearSelection} size="sm" variant="ghost">
            Clear
          </Button>
        </div>
      )}

      {/* Invitations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Invitations</CardTitle>
          <CardDescription>
            Manage user invitations, resend expired ones, and track acceptance rates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SmoothLoadingWrapper
            isLoading={isLoading}
            skeleton={
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-8 w-48" />
                  <Skeleton className="h-8 w-32" />
                </div>
                <TableSkeleton rows={8} columns={8} />
              </div>
            }
          >
            {!filteredInvitations || filteredInvitations.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto h-12 w-12 text-gray-400">
                <Mail className="h-12 w-12" />
              </div>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No invitations found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || statusFilter !== 'all' || roleFilter !== 'all' || companyFilter !== 'all' 
                  ? 'Try adjusting your search or filters.'
                  : 'Get started by inviting your first user.'
                }
              </p>
              {searchTerm || statusFilter !== 'all' || roleFilter !== 'all' || companyFilter !== 'all' ? (
                <Button 
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    setRoleFilter('all');
                    setCompanyFilter('all');
                  }}
                  variant="outline"
                  className="mt-4"
                >
                  Clear filters
                </Button>
              ) : null}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectedInvitations.size === (filteredInvitations?.length || 0) && (filteredInvitations?.length || 0) > 0}
                      onChange={selectAllInvitations}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invitee</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expires</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invited By</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(filteredInvitations || []).map((invitation) => (
                  <tr key={invitation.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedInvitations.has(invitation.id)}
                        onChange={() => toggleInvitationSelection(invitation.id)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{invitation.email}</div>
                        {invitation.user_data?.first_name && invitation.user_data?.last_name && (
                          <div className="text-sm text-gray-500">
                            {invitation.user_data.first_name} {invitation.user_data.last_name}
                          </div>
                        )}
                        {invitation.user_data?.job_title && (
                          <div className="text-xs text-gray-400">{invitation.user_data.job_title}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        <div>{invitation.company_name || 'No Company'}</div>
                        {invitation.user_data?.department && (
                          <div className="text-xs text-gray-500">{invitation.user_data.department}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getRoleBadge(invitation.role)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(invitation.status)}
                      {invitation.status === 'accepted' && invitation.accepted_at && (
                        <div className="text-xs text-gray-500 mt-1">
                          Accepted {new Date(invitation.accepted_at).toLocaleDateString()}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(invitation.expires_at).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {invitation.status === 'pending' ? (
                          <span className={isExpired(invitation.expires_at) ? 'text-red-600' : 'text-green-600'}>
                            {isExpired(invitation.expires_at) ? 'Expired' : getTimeUntilExpiry(invitation.expires_at)}
                          </span>
                        ) : (
                          'N/A'
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {invitation.inviter_name || 'Unknown'}
                      <div className="text-xs text-gray-500">
                        {new Date(invitation.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {invitation.status === 'pending' && !isExpired(invitation.expires_at) && (
                          <Button
                            onClick={() => resendInvitation(invitation.id)}
                            size="sm"
                            variant="outline"
                            disabled={updating === invitation.id}
                          >
                            <Mail className="h-3 w-3 mr-1" />
                            Resend
                          </Button>
                        )}
                        
                        {invitation.status === 'pending' && (
                          <Button
                            onClick={() => cancelInvitation(invitation.id)}
                            size="sm"
                            variant="outline"
                            disabled={updating === invitation.id}
                          >
                            <XCircle className="h-3 w-3 mr-1" />
                            Cancel
                          </Button>
                        )}
                        
                        <Button
                          onClick={() => deleteInvitation(invitation.id)}
                          size="sm"
                          variant="outline"
                          disabled={updating === invitation.id}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Delete
                        </Button>
                        
                        {updating === invitation.id && (
                          <span className="text-sm text-gray-500">Updating...</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
          </SmoothLoadingWrapper>
        </CardContent>
      </Card>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {startInvitation} to {endInvitation} of {totalInvitations} results
          </div>
          
          <div className="flex items-center space-x-2">
            {/* First Page */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateToPage(1)}
              disabled={currentPage === 1}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            
            {/* Previous Page */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateToPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            {/* Page Numbers */}
            <div className="flex items-center space-x-1">
              {getPageNumbers().map((page, index) => (
                <div key={index}>
                  {page === '...' ? (
                    <span className="px-3 py-2 text-sm text-gray-500">...</span>
                  ) : (
                    <Button
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => navigateToPage(page as number)}
                      className="min-w-[40px]"
                    >
                      {page}
                    </Button>
                  )}
                </div>
              ))}
            </div>
            
            {/* Next Page */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            
            {/* Last Page */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateToPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="text-sm text-gray-500">
        Showing {filteredInvitations?.length || 0} of {invitations?.length || 0} invitations on this page
      </div>
    </div>
  );
} 