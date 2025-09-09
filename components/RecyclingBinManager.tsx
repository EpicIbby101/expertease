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
  User
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
      {/* Stats Overview */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Deleted</CardTitle>
            <Trash2 className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{companyStats.totalDeleted + userStats.totalDeleted}</div>
            <p className="text-xs text-gray-500">Companies + Users</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recoverable</CardTitle>
            <Clock className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{companyStats.recoverable + userStats.recoverable}</div>
            <p className="text-xs text-gray-500">Within 30 days</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Permanently Deleted</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{companyStats.permanentlyDeleted + userStats.permanentlyDeleted}</div>
            <p className="text-xs text-gray-500">Over 30 days old</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Companies</CardTitle>
            <Building className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{companyStats.totalDeleted}</div>
            <p className="text-xs text-gray-500">Deleted companies</p>
          </CardContent>
        </Card>
      </div>

      {/* Recycling Bin Tabs */}
      <Tabs defaultValue="companies" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="companies" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            Companies ({companyStats.totalDeleted})
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Users ({userStats.totalDeleted})
          </TabsTrigger>
        </TabsList>

        {/* Companies Tab */}
        <TabsContent value="companies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Deleted Companies</CardTitle>
              <CardDescription>
                Manage deleted companies. Items can be recovered within 30 days of deletion.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {companies.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No deleted companies found
                </div>
              ) : (
                <div className="space-y-4">
                  {companies.map((company) => (
                    <div
                      key={company.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-red-100 rounded-lg">
                          <Building className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{company.name}</h3>
                            <Badge variant="outline" className="text-xs">
                              {company.slug}
                            </Badge>
                            {isRecoverable(company.deleted_at) ? (
                              <Badge className="bg-green-100 text-green-800">Recoverable</Badge>
                            ) : (
                              <Badge variant="destructive">Expired</Badge>
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
                      <div className="flex items-center gap-2">
                        {isRecoverable(company.deleted_at) && (
                          <Button
                            onClick={() => recoverCompany(company.id)}
                            variant="outline"
                            size="sm"
                            disabled={loading}
                          >
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Recover
                          </Button>
                        )}
                        <Button
                          onClick={() => permanentlyDeleteCompany(company.id)}
                          variant="destructive"
                          size="sm"
                          disabled={loading}
                        >
                          <X className="h-4 w-4 mr-2" />
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
              <CardTitle>Deleted Users</CardTitle>
              <CardDescription>
                Manage deleted users. Items can be recovered within 30 days of deletion.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {users.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No deleted users found
                </div>
              ) : (
                <div className="space-y-4">
                  {users.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-red-100 rounded-lg">
                          <User className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">
                              {user.first_name && user.last_name 
                                ? `${user.first_name} ${user.last_name}`
                                : user.email
                              }
                            </h3>
                            <Badge className={getRoleBadgeColor(user.role)}>
                              {user.role.replace('_', ' ')}
                            </Badge>
                            {isRecoverable(user.deleted_at) ? (
                              <Badge className="bg-green-100 text-green-800">Recoverable</Badge>
                            ) : (
                              <Badge variant="destructive">Expired</Badge>
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
                      <div className="flex items-center gap-2">
                        {isRecoverable(user.deleted_at) && (
                          <Button
                            onClick={() => recoverUser(user.id)}
                            variant="outline"
                            size="sm"
                            disabled={loading}
                          >
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Recover
                          </Button>
                        )}
                        <Button
                          onClick={() => permanentlyDeleteUser(user.id)}
                          variant="destructive"
                          size="sm"
                          disabled={loading}
                        >
                          <X className="h-4 w-4 mr-2" />
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