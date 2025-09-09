'use client';

import { useState } from 'react';
import { 
  Users, 
  Shield, 
  Building, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Download,
  Upload,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingButton } from '@/components/ui/loading-button';
import { toast } from 'sonner';

interface User {
  id: string;
  email: string;
  role: string;
  company_id?: string;
  company_name?: string;
  first_name?: string;
  last_name?: string;
  is_active?: boolean;
  profile_completed?: boolean;
}

interface Company {
  id: string;
  name: string;
  slug: string;
  max_trainees: number;
  is_active: boolean;
}

interface BulkUserOperationsProps {
  selectedUsers: Set<string>;
  users: User[];
  companies: Company[];
  onOperationComplete: () => void;
  onClose: () => void;
}

type BulkOperation = 
  | 'update_role'
  | 'assign_company'
  | 'toggle_status'
  | 'export_selected'
  | 'delete_users';

export function BulkUserOperations({ 
  selectedUsers, 
  users, 
  companies, 
  onOperationComplete, 
  onClose 
}: BulkUserOperationsProps) {
  const [selectedOperation, setSelectedOperation] = useState<BulkOperation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [operationData, setOperationData] = useState({
    newRole: '',
    newCompanyId: '',
    newStatus: true,
    confirmText: ''
  });

  const selectedUsersList = users.filter(user => selectedUsers.has(user.id));
  const selectedCount = selectedUsers.size;

  const handleOperationSelect = (operation: BulkOperation) => {
    setSelectedOperation(operation);
    setOperationData({
      newRole: '',
      newCompanyId: '',
      newStatus: true,
      confirmText: ''
    });
  };

  const handleBulkRoleUpdate = async () => {
    if (!operationData.newRole) {
      toast.error('Please select a role');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/users/bulk-update-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userIds: Array.from(selectedUsers),
          role: operationData.newRole
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update roles');
      }

      toast.success(`Successfully updated ${selectedCount} users to ${operationData.newRole}`);
      onOperationComplete();
      onClose();
    } catch (error) {
      console.error('Error updating roles:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update roles');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkCompanyAssignment = async () => {
    if (!operationData.newCompanyId) {
      toast.error('Please select a company');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/users/bulk-assign-company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userIds: Array.from(selectedUsers),
          companyId: operationData.newCompanyId
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to assign company');
      }

      const companyName = companies.find(c => c.id === operationData.newCompanyId)?.name || 'Unknown';
      toast.success(`Successfully assigned ${selectedCount} users to ${companyName}`);
      onOperationComplete();
      onClose();
    } catch (error) {
      console.error('Error assigning company:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to assign company');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkStatusToggle = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/users/bulk-toggle-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userIds: Array.from(selectedUsers),
          isActive: operationData.newStatus
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update status');
      }

      const action = operationData.newStatus ? 'activated' : 'deactivated';
      toast.success(`Successfully ${action} ${selectedCount} users`);
      onOperationComplete();
      onClose();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update status');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkExport = () => {
    const csvContent = [
      ['Email', 'Name', 'Role', 'Company', 'Status', 'Profile Completed', 'Last Active'],
      ...selectedUsersList.map(user => [
        user.email,
        user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : 'N/A',
        user.role,
        user.company_name || 'No Company',
        user.is_active ? 'Active' : 'Inactive',
        user.profile_completed ? 'Yes' : 'No',
        'N/A' // We'd need to add last_active_at to the User interface
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `selected-users-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success(`Exported ${selectedCount} users to CSV`);
    onClose();
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'site_admin': return 'bg-purple-100 text-purple-800';
      case 'company_admin': return 'bg-green-100 text-green-800';
      case 'trainee': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge variant="default" className="bg-green-100 text-green-800">
        <CheckCircle className="h-3 w-3 mr-1" />
        Active
      </Badge>
    ) : (
      <Badge variant="secondary" className="bg-red-100 text-red-800">
        <XCircle className="h-3 w-3 mr-1" />
        Inactive
      </Badge>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Bulk User Operations
                </h2>
                <p className="text-gray-600">{selectedCount} users selected</p>
              </div>
            </div>
            <Button onClick={onClose} variant="outline" size="sm">
              Close
            </Button>
          </div>

          {/* Selected Users Preview */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Selected Users</CardTitle>
              <CardDescription>
                Preview of users that will be affected by the operation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-40 overflow-y-auto space-y-2">
                {selectedUsersList.slice(0, 10).map(user => (
                  <div key={user.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div>
                      <div className="font-medium text-sm">{user.email}</div>
                      <div className="text-xs text-gray-500">
                        {user.first_name && user.last_name 
                          ? `${user.first_name} ${user.last_name}`
                          : 'Name not set'
                        }
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getRoleBadgeColor(user.role)}>
                        {user.role.replace('_', ' ')}
                      </Badge>
                      {getStatusBadge(user.is_active ?? true)}
                    </div>
                  </div>
                ))}
                {selectedUsersList.length > 10 && (
                  <div className="text-sm text-gray-500 text-center py-2">
                    ... and {selectedUsersList.length - 10} more users
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Operation Selection */}
          {!selectedOperation && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleOperationSelect('update_role')}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Shield className="h-8 w-8 text-blue-600" />
                    <div>
                      <h3 className="font-semibold">Update Roles</h3>
                      <p className="text-sm text-gray-600">Change user roles in bulk</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleOperationSelect('assign_company')}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Building className="h-8 w-8 text-green-600" />
                    <div>
                      <h3 className="font-semibold">Assign Company</h3>
                      <p className="text-sm text-gray-600">Assign users to a company</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleOperationSelect('toggle_status')}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Settings className="h-8 w-8 text-orange-600" />
                    <div>
                      <h3 className="font-semibold">Toggle Status</h3>
                      <p className="text-sm text-gray-600">Activate or deactivate users</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleOperationSelect('export_selected')}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Download className="h-8 w-8 text-purple-600" />
                    <div>
                      <h3 className="font-semibold">Export Selected</h3>
                      <p className="text-sm text-gray-600">Download user data as CSV</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Operation Forms */}
          {selectedOperation === 'update_role' && (
            <Card>
              <CardHeader>
                <CardTitle>Update User Roles</CardTitle>
                <CardDescription>
                  Select a new role for all {selectedCount} selected users
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Role
                  </label>
                  <select
                    value={operationData.newRole}
                    onChange={(e) => setOperationData(prev => ({ ...prev, newRole: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select a role</option>
                    <option value="trainee">Trainee</option>
                    <option value="company_admin">Company Admin</option>
                    <option value="site_admin">Site Admin</option>
                  </select>
                </div>
                <div className="flex items-center gap-3">
                  <LoadingButton
                    onClick={handleBulkRoleUpdate}
                    loading={isLoading}
                    loadingText="Updating..."
                    disabled={!operationData.newRole}
                  >
                    Update {selectedCount} Users
                  </LoadingButton>
                  <Button onClick={() => setSelectedOperation(null)} variant="outline">
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {selectedOperation === 'assign_company' && (
            <Card>
              <CardHeader>
                <CardTitle>Assign Company</CardTitle>
                <CardDescription>
                  Assign all {selectedCount} selected users to a company
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company
                  </label>
                  <select
                    value={operationData.newCompanyId}
                    onChange={(e) => setOperationData(prev => ({ ...prev, newCompanyId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select a company</option>
                    {companies.map(company => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-3">
                  <LoadingButton
                    onClick={handleBulkCompanyAssignment}
                    loading={isLoading}
                    loadingText="Assigning..."
                    disabled={!operationData.newCompanyId}
                  >
                    Assign {selectedCount} Users
                  </LoadingButton>
                  <Button onClick={() => setSelectedOperation(null)} variant="outline">
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {selectedOperation === 'toggle_status' && (
            <Card>
              <CardHeader>
                <CardTitle>Toggle User Status</CardTitle>
                <CardDescription>
                  Activate or deactivate all {selectedCount} selected users
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Status
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="status"
                        checked={operationData.newStatus}
                        onChange={() => setOperationData(prev => ({ ...prev, newStatus: true }))}
                        className="mr-2"
                      />
                      <span className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        Activate Users
                      </span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="status"
                        checked={!operationData.newStatus}
                        onChange={() => setOperationData(prev => ({ ...prev, newStatus: false }))}
                        className="mr-2"
                      />
                      <span className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-600" />
                        Deactivate Users
                      </span>
                    </label>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <LoadingButton
                    onClick={handleBulkStatusToggle}
                    loading={isLoading}
                    loadingText="Updating..."
                  >
                    {operationData.newStatus ? 'Activate' : 'Deactivate'} {selectedCount} Users
                  </LoadingButton>
                  <Button onClick={() => setSelectedOperation(null)} variant="outline">
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {selectedOperation === 'export_selected' && (
            <Card>
              <CardHeader>
                <CardTitle>Export Selected Users</CardTitle>
                <CardDescription>
                  Download data for {selectedCount} selected users as a CSV file
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-800">
                    <Download className="h-5 w-5" />
                    <span className="font-medium">Export includes:</span>
                  </div>
                  <ul className="mt-2 text-sm text-blue-700 space-y-1">
                    <li>• Email address</li>
                    <li>• Full name</li>
                    <li>• Role</li>
                    <li>• Company assignment</li>
                    <li>• Account status</li>
                    <li>• Profile completion status</li>
                  </ul>
                </div>
                <div className="flex items-center gap-3">
                  <Button onClick={handleBulkExport} className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Export {selectedCount} Users
                  </Button>
                  <Button onClick={() => setSelectedOperation(null)} variant="outline">
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
