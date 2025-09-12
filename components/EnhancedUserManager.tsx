'use client';

import { useState, useMemo } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Search, Filter, MoreHorizontal, Eye, Edit, Trash2, UserCheck, UserX, Download, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, RefreshCw, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { LoadingButton } from '@/components/ui/loading-button';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { Skeleton } from '@/components/ui/skeleton';
import { SmoothLoadingWrapper } from '@/components/ui/smooth-loading-wrapper';
import { UserProfileManager } from '@/components/UserProfileManager';
import { FloatingBulkToolbar } from '@/components/FloatingBulkToolbar';
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
  location?: string;
  date_of_birth?: string;
  is_active?: boolean;
  profile_completed?: boolean;
  last_active_at?: string;
}

interface Company {
  id: string;
  name: string;
  slug: string;
  max_trainees: number;
  is_active: boolean;
}

interface EnhancedUserManagerProps {
  users: User[];
  companies: Company[];
  totalUsers: number;
  currentPage: number;
  pageSize: number;
  isLoading?: boolean;
}

export function EnhancedUserManager({ users, companies, totalUsers, currentPage, pageSize, isLoading = false }: EnhancedUserManagerProps) {
  const { userId: currentUserId } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [companyFilter, setCompanyFilter] = useState<string>('all');
  const [updating, setUpdating] = useState<string | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [selectedUserForProfile, setSelectedUserForProfile] = useState<User | null>(null);

  // Calculate pagination values
  const totalPages = Math.ceil(totalUsers / pageSize);
  const startUser = (currentPage - 1) * pageSize + 1;
  const endUser = Math.min(currentPage * pageSize, totalUsers);

  // Filter users based on search and filters
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (user.company_name && user.company_name.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      const matchesCompany = companyFilter === 'all' || user.company_name === companyFilter;
      
      return matchesSearch && matchesRole && matchesCompany;
    });
  }, [users, searchTerm, roleFilter, companyFilter]);

  // Navigation functions
  const navigateToPage = (page: number) => {
    const params = new URLSearchParams();
    params.set('page', page.toString());
    params.set('limit', pageSize.toString());
    router.push(`?${params.toString()}`);
  };

  // Refresh function
  const refreshUsers = async () => {
    setIsRefreshing(true);
    try {
      // Use router.refresh() to trigger a server-side refresh of the current route
      router.refresh();
      toast.success('Users refreshed successfully');
    } catch (error) {
      console.error('Error refreshing users:', error);
      toast.error('Failed to refresh users');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Action functions
  const updateRole = async (userId: string, newRole: 'site_admin' | 'company_admin' | 'trainee') => {
    // Prevent site admins from downgrading themselves
    if (userId === currentUserId && newRole !== 'site_admin') {
      toast.error('Site admins cannot downgrade their own role');
      return;
    }

    setUpdating(userId);
    try {
      const response = await fetch('/api/admin/update-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update role');
      }
      
      toast.success('Role updated successfully');
      // Refresh the users data instead of reloading the page
      refreshUsers();
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update role');
    } finally {
      setUpdating(null);
    }
  };

  const toggleUserSelection = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const selectAllUsers = () => {
    const allSelected = selectedUsers.size === (filteredUsers?.length || 0) && (filteredUsers?.length || 0) > 0;
    if (allSelected) {
      // If all are selected, deselect all
      setSelectedUsers(new Set());
    } else {
      // If not all are selected, select all
      setSelectedUsers(new Set((filteredUsers || []).map(u => u.id)));
    }
  };

  const clearSelection = () => {
    setSelectedUsers(new Set());
  };

  const bulkUpdateRole = async (newRole: 'site_admin' | 'company_admin' | 'trainee') => {
    if (selectedUsers.size === 0) {
      toast.error('No users selected');
      return;
    }

    // Prevent bulk downgrading if current user is selected
    if (selectedUsers.has(currentUserId!) && newRole !== 'site_admin') {
      toast.error('Cannot downgrade your own role in bulk operations');
      return;
    }

    setUpdating('bulk');
    try {
              const promises = Array.from(selectedUsers || []).map(userId => 
        fetch('/api/admin/update-role', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, role: newRole }),
        })
      );

      await Promise.all(promises);
      toast.success(`Updated ${selectedUsers.size} users successfully`);
      // Refresh the users data instead of reloading the page
      refreshUsers();
    } catch (error) {
      console.error('Error in bulk update:', error);
      toast.error('Failed to update some users');
    } finally {
      setUpdating(null);
    }
  };

  const exportUsers = () => {
    const csvContent = [
      ['Email', 'Role', 'Company', 'Created At'],
              ...(filteredUsers || []).map(user => [
        user.email,
        user.role,
        user.company_name || 'N/A',
        new Date(user.created_at).toLocaleDateString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const openUserProfile = (user: User) => {
    setSelectedUserForProfile(user);
    setProfileModalOpen(true);
  };

  const closeUserProfile = () => {
    setProfileModalOpen(false);
    setSelectedUserForProfile(null);
  };

  const handleUserProfileUpdated = () => {
    refreshUsers();
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'site_admin': return 'bg-purple-100 text-purple-800';
      case 'company_admin': return 'bg-green-100 text-green-800';
      case 'trainee': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const isCurrentUser = (user: User) => user.id === currentUserId;

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
    <div className="space-y-4">
      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search by email or company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <select 
          value={roleFilter} 
          onChange={(e) => setRoleFilter(e.target.value)}
          className="w-[180px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option key="all" value="all">All Roles</option>
          <option key="site_admin" value="site_admin">Site Admin</option>
          <option key="company_admin" value="company_admin">Company Admin</option>
          <option key="trainee" value="trainee">Trainee</option>
        </select>

        <select 
          value={companyFilter} 
          onChange={(e) => setCompanyFilter(e.target.value)}
          className="w-[180px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Companies</option>
          {(companies || []).map(company => (
            <option key={company.id} value={company.name}>{company.name}</option>
          ))}
        </select>

        <Button onClick={exportUsers} variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>

        <LoadingButton 
          onClick={refreshUsers} 
          variant="outline" 
          size="sm"
          loading={isRefreshing}
          loadingText="Refreshing..."
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </LoadingButton>
      </div>

      {/* Floating Bulk Actions Toolbar */}
      <FloatingBulkToolbar
        selectedCount={selectedUsers.size}
        onClearSelection={clearSelection}
        onBulkRoleChange={(role) => bulkUpdateRole(role as "site_admin" | "company_admin" | "trainee")}
        onBulkExport={() => {
          // TODO: Implement bulk export
          toast.info('Bulk export feature coming soon!');
        }}
        onBulkDelete={() => {
          // TODO: Implement bulk delete
          toast.info('Bulk delete feature coming soon!');
        }}
        onBulkActivate={() => {
          // TODO: Implement bulk activate
          toast.info('Bulk activate feature coming soon!');
        }}
        onBulkDeactivate={() => {
          // TODO: Implement bulk deactivate
          toast.info('Bulk deactivate feature coming soon!');
        }}
        isUpdating={updating === 'bulk'}
      />

      {/* Users Table */}
      <SmoothLoadingWrapper
        isLoading={isLoading}
        skeleton={
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-8 w-32" />
            </div>
            <TableSkeleton rows={8} columns={7} />
          </div>
        }
      >
        {!filteredUsers || filteredUsers.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 text-gray-400">
            <UserX className="h-12 w-12" />
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || roleFilter !== 'all' || companyFilter !== 'all' 
              ? 'Try adjusting your search or filters.'
              : 'Get started by inviting your first user.'
            }
          </p>
          {searchTerm || roleFilter !== 'all' || companyFilter !== 'all' ? (
            <Button 
              onClick={() => {
                setSearchTerm('');
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
                  checked={selectedUsers.size === (filteredUsers?.length || 0) && (filteredUsers?.length || 0) > 0}
                  onChange={selectAllUsers}
                  className="rounded border-gray-300"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {(filteredUsers || []).map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={selectedUsers.has(user.id)}
                    onChange={() => toggleUserSelection(user.id)}
                    className="rounded border-gray-300"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{user.email}</div>
                    <div className="text-sm text-gray-500">
                      {user.first_name && user.last_name 
                        ? `${user.first_name} ${user.last_name}`
                        : 'Name not set'
                      }
                    </div>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {user.phone && (
                        <span className="text-xs text-gray-400">📞 {user.phone}</span>
                      )}
                      {user.location && (
                        <span className="text-xs text-gray-400">📍 {user.location}</span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div>
                    <div>{user.company_name || 'No Company'}</div>
                    {user.department && (
                      <div className="text-xs text-gray-500">{user.department}</div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Badge className={getRoleBadgeColor(user.role)}>
                    {user.role.replace('_', ' ')}
                  </Badge>
                  {user.job_title && (
                    <div className="text-xs text-gray-500 mt-1">{user.job_title}</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    <Badge variant={user.is_active ? "default" : "secondary"}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div className="text-xs text-gray-500">
                    {user.last_active_at 
                      ? `Last active ${new Date(user.last_active_at).toLocaleDateString()}`
                      : 'Never active'
                    }
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    Profile: {user.profile_completed ? 'Complete' : 'Incomplete'} • Joined {new Date(user.created_at).toLocaleDateString()}
                  </div>
                </td>

                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <select
                      value={user.role}
                      onChange={(e) => updateRole(user.id, e.target.value as any)}
                      disabled={updating === user.id || isCurrentUser(user)}
                      className="w-[120px] px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <option key="trainee" value="trainee">Trainee</option>
                      <option key="company_admin" value="company_admin">Company Admin</option>
                      <option key="site_admin" value="site_admin">Site Admin</option>
                    </select>
                    
                    <Button
                      onClick={() => openUserProfile(user)}
                      variant="outline"
                      size="sm"
                      className="h-8 w-16"
                      title="View Profile"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    
                    {isCurrentUser(user) && (
                      <Badge variant="secondary" className="text-xs">
                        You
                      </Badge>
                    )}
                    
                    {updating === user.id && (
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

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Showing {startUser} to {endUser} of {totalUsers} results
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
        Showing {filteredUsers?.length || 0} of {users?.length || 0} users on this page
      </div>

      {/* User Profile Modal */}
      {profileModalOpen && selectedUserForProfile && (
        <UserProfileManager
          user={selectedUserForProfile}
          companies={companies}
          onClose={closeUserProfile}
          onUserUpdated={handleUserProfileUpdated}
        />
      )}
    </div>
  );
} 