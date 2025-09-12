'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Trash2, 
  Clock, 
  AlertTriangle, 
  RotateCcw, 
  X, 
  Building, 
  Users,
  Calendar,
  User,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface DeletedCompany {
  id: string;
  name: string;
  slug: string;
  description?: string;
  max_trainees: number;
  is_active: boolean;
  created_at: string;
  deleted_at: string;
  deleted_by?: string;
  deleted_reason?: string;
}

interface DeletedUser {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: string;
  company_name?: string;
  created_at: string;
  deleted_at: string;
  deleted_by?: string;
  deleted_reason?: string;
}

interface RecyclingBinManagerProps {
  deletedCompanies?: DeletedCompany[];
  deletedUsers?: DeletedUser[];
}

export function RecyclingBinManager({ 
  deletedCompanies = [], 
  deletedUsers = [] 
}: RecyclingBinManagerProps) {
  const [companies, setCompanies] = useState<DeletedCompany[]>(deletedCompanies);
  const [users, setUsers] = useState<DeletedUser[]>(deletedUsers);
  const [loading, setLoading] = useState(false);

  // Calculate stats
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
  
  const companyStats = {
    totalDeleted: companies.length,
    recoverable: companies.filter(c => new Date(c.deleted_at) > thirtyDaysAgo).length,
    permanentlyDeleted: companies.filter(c => new Date(c.deleted_at) <= thirtyDaysAgo).length,
  };

  const userStats = {
    totalDeleted: users.length,
    recoverable: users.filter(u => new Date(u.deleted_at) > thirtyDaysAgo).length,
    permanentlyDeleted: users.filter(u => new Date(u.deleted_at) <= thirtyDaysAgo).length,
  };

  // Recover company
  const recoverCompany = async (companyId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/companies/${companyId}/recover`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to recover company');
      }

      toast.success('Company recovered successfully');
      setCompanies(prev => prev.filter(c => c.id !== companyId));
    } catch (error) {
      console.error('Error recovering company:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to recover company');
    } finally {
      setLoading(false);
    }
  };

  // Permanently delete company
  const permanentlyDeleteCompany = async (companyId: string) => {
    if (!confirm('Are you sure you want to permanently delete this company? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/companies/${companyId}/permanently-delete`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to permanently delete company');
      }

      toast.success('Company permanently deleted');
      setCompanies(prev => prev.filter(c => c.id !== companyId));
    } catch (error) {
      console.error('Error permanently deleting company:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to permanently delete company');
    } finally {
      setLoading(false);
    }
  };

  // Recover user
  const recoverUser = async (userId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}/recover`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to recover user');
      }

      toast.success('User recovered successfully');
      setUsers(prev => prev.filter(u => u.id !== userId));
    } catch (error) {
      console.error('Error recovering user:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to recover user');
    } finally {
      setLoading(false);
    }
  };

  // Permanently delete user
  const permanentlyDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to permanently delete this user? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}/permanently-delete`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to permanently delete user');
      }

      toast.success('User permanently deleted');
      setUsers(prev => prev.filter(u => u.id !== userId));
    } catch (error) {
      console.error('Error permanently deleting user:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to permanently delete user');
    } finally {
      setLoading(false);
    }
  };

  // Get role badge color
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'site_admin': return 'bg-purple-100 text-purple-800';
      case 'company_admin': return 'bg-green-100 text-green-800';
      case 'trainee': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Check if item is recoverable
  const isRecoverable = (deletedAt: string) => {
    return new Date(deletedAt) > thirtyDaysAgo;
  };

  return (
    <div className="space-y-6">

      {/* Enhanced Recycling Bin Tabs */}
      <Tabs defaultValue="companies" className="w-full">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <TabsList className="grid w-full grid-cols-2 sm:w-auto">
            <TabsTrigger value="companies" className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              Companies ({companyStats.totalDeleted})
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Users ({userStats.totalDeleted})
            </TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-green-600" />
              <span className="font-medium text-green-600">{companyStats.recoverable + userStats.recoverable}</span>
              <span>recoverable</span>
            </div>
            <div className="h-4 w-px bg-gray-300"></div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <span className="font-medium text-orange-600">{companyStats.permanentlyDeleted + userStats.permanentlyDeleted}</span>
              <span>expired</span>
            </div>
          </div>
        </div>

        {/* Companies Tab */}
        <TabsContent value="companies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5 text-blue-600" />
                Deleted Companies
              </CardTitle>
              <CardDescription>
                Manage deleted companies. Items can be recovered within 30 days of deletion.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {companies.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Building className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No deleted companies</h3>
                  <p className="text-gray-500">All companies are currently active</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {companies.map((company) => (
                    <div
                      key={company.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow bg-white"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-lg ${isRecoverable(company.deleted_at) ? 'bg-red-100' : 'bg-gray-100'}`}>
                          <Building className={`h-5 w-5 ${isRecoverable(company.deleted_at) ? 'text-red-600' : 'text-gray-400'}`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-gray-900">{company.name}</h3>
                            <Badge variant="outline" className="text-xs text-gray-500">
                              {company.slug}
                            </Badge>
                            {isRecoverable(company.deleted_at) ? (
                              <Badge className="bg-green-100 text-green-800 border-green-200">
                                <Clock className="h-3 w-3 mr-1" />
                                Recoverable
                              </Badge>
                            ) : (
                              <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Expired
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            <div className="flex items-center gap-4">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Deleted {formatDistanceToNow(new Date(company.deleted_at), { addSuffix: true })}
                              </span>
                              {company.deleted_reason && (
                                <span>Reason: {company.deleted_reason}</span>
                              )}
                            </div>
                            {company.description && (
                              <p className="mt-1">{company.description}</p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {isRecoverable(company.deleted_at) && (
                          <Button
                            onClick={() => recoverCompany(company.id)}
                            disabled={loading}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <RefreshCw className="h-4 w-4 mr-1" />
                            Recover
                          </Button>
                        )}
                        <Button
                          onClick={() => permanentlyDeleteCompany(company.id)}
                          disabled={loading}
                          variant="destructive"
                          size="sm"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete Forever
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                Deleted Users
              </CardTitle>
              <CardDescription>
                Manage deleted users. Items can be recovered within 30 days of deletion.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {users.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-white mb-2">No deleted users</h3>
                  <p className="text-gray-500">All users are currently active</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {users.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow bg-white"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-lg ${isRecoverable(user.deleted_at) ? 'bg-red-100' : 'bg-gray-100'}`}>
                          <User className={`h-5 w-5 ${isRecoverable(user.deleted_at) ? 'text-red-600' : 'text-gray-400'}`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-gray-900">
                              {user.first_name && user.last_name 
                                ? `${user.first_name} ${user.last_name}`
                                : user.email
                              }
                            </h3>
                            <Badge className={getRoleBadgeColor(user.role)}>
                              {user.role.replace('_', ' ')}
                            </Badge>
                            {isRecoverable(user.deleted_at) ? (
                              <Badge className="bg-green-100 text-green-800 border-green-200">
                                <Clock className="h-3 w-3 mr-1" />
                                Recoverable
                              </Badge>
                            ) : (
                              <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Expired
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            <div className="flex items-center gap-4">
                              <span>{user.email}</span>
                              {user.company_name && (
                                <span>• {user.company_name}</span>
                              )}
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Deleted {formatDistanceToNow(new Date(user.deleted_at), { addSuffix: true })}
                              </span>
                            </div>
                            {user.deleted_reason && (
                              <p className="mt-1">Reason: {user.deleted_reason}</p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {isRecoverable(user.deleted_at) && (
                          <Button
                            onClick={() => recoverUser(user.id)}
                            disabled={loading}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <RefreshCw className="h-4 w-4 mr-1" />
                            Recover
                          </Button>
                        )}
                        <Button
                          onClick={() => permanentlyDeleteUser(user.id)}
                          disabled={loading}
                          variant="destructive"
                          size="sm"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete Forever
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}