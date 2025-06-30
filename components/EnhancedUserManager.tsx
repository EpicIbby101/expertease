'use client';

import { useState, useMemo } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Search, Filter, MoreHorizontal, Eye, Edit, Trash2, UserCheck, UserX, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface User {
  id: string;
  email: string;
  role: 'site_admin' | 'company_admin' | 'trainee';
  company_name?: string;
  created_at: string;
}

interface EnhancedUserManagerProps {
  users: User[];
  companies: string[];
}

export function EnhancedUserManager({ users, companies }: EnhancedUserManagerProps) {
  const { userId } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [companyFilter, setCompanyFilter] = useState<string>('all');
  const [updating, setUpdating] = useState<string | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());

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

  const updateRole = async (userId: string, newRole: 'site_admin' | 'company_admin' | 'trainee') => {
    // Prevent site admins from downgrading themselves
    if (userId === userId && newRole !== 'site_admin') {
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
      // Refresh the page to show updated roles
      window.location.reload();
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
    setSelectedUsers(new Set(filteredUsers.map(u => u.id)));
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
    if (selectedUsers.has(userId!) && newRole !== 'site_admin') {
      toast.error('Cannot downgrade your own role in bulk operations');
      return;
    }

    setUpdating('bulk');
    try {
      const promises = Array.from(selectedUsers).map(userId => 
        fetch('/api/admin/update-role', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, role: newRole }),
        })
      );

      await Promise.all(promises);
      toast.success(`Updated ${selectedUsers.size} users successfully`);
      window.location.reload();
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
      ...filteredUsers.map(user => [
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

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'site_admin': return 'bg-purple-100 text-purple-800';
      case 'company_admin': return 'bg-green-100 text-green-800';
      case 'trainee': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const isCurrentUser = (user: User) => user.id === userId;

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
          {companies.map(company => (
            <option key={company} value={company}>{company}</option>
          ))}
        </select>

        <Button onClick={exportUsers} variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Bulk Actions */}
      {selectedUsers.size > 0 && (
        <div className="flex items-center gap-2 p-4 bg-blue-50 rounded-lg">
          <span className="text-sm text-blue-800">
            {selectedUsers.size} user{selectedUsers.size !== 1 ? 's' : ''} selected
          </span>
          <Button
            onClick={() => bulkUpdateRole('site_admin')}
            size="sm"
            variant="outline"
            disabled={updating === 'bulk'}
          >
            <UserCheck className="h-4 w-4 mr-1" />
            Make Site Admin
          </Button>
          <Button
            onClick={() => bulkUpdateRole('company_admin')}
            size="sm"
            variant="outline"
            disabled={updating === 'bulk'}
          >
            <UserCheck className="h-4 w-4 mr-1" />
            Make Company Admin
          </Button>
          <Button
            onClick={() => bulkUpdateRole('trainee')}
            size="sm"
            variant="outline"
            disabled={updating === 'bulk'}
          >
            <UserCheck className="h-4 w-4 mr-1" />
            Make Trainee
          </Button>
          <Button onClick={clearSelection} size="sm" variant="ghost">
            Clear
          </Button>
        </div>
      )}

      {/* Users Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedUsers.size === filteredUsers.length && filteredUsers.length > 0}
                  onChange={selectedUsers.size === filteredUsers.length ? clearSelection : selectAllUsers}
                  className="rounded border-gray-300"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Company
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredUsers.map((user) => (
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
                      Joined {new Date(user.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {user.company_name || 'No Company'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Badge className={getRoleBadgeColor(user.role)}>
                    {user.role.replace('_', ' ')}
                  </Badge>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    <span className="text-green-600">Active</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    Account created
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center gap-2">
                    <select
                      value={user.role}
                      onChange={(e) => updateRole(user.id, e.target.value as any)}
                      disabled={updating === user.id || isCurrentUser(user)}
                      className="w-[140px] px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <option value="trainee">Trainee</option>
                      <option value="company_admin">Company Admin</option>
                      <option value="site_admin">Site Admin</option>
                    </select>
                    
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
        
        {filteredUsers.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No users found matching your criteria
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="text-sm text-gray-500">
        Showing {filteredUsers.length} of {users.length} users
      </div>
    </div>
  );
} 