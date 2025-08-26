'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building, Plus, Trash2, Users, Calendar, Settings, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { CreateCompanyModal } from './CreateCompanyModal';
import { DeleteCompanyModal } from './DeleteCompanyModal';

interface Company {
  id: string;
  name: string;
  slug: string;
  description?: string;
  max_trainees: number;
  is_active: boolean;
  created_at: string;
  users?: Array<{ company_id: string; role: string }>;
}

interface CompanyManagerProps {
  companies: Company[];
}

export function CompanyManager({ companies }: CompanyManagerProps) {
  const router = useRouter();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);

  // Refresh function
  const refreshCompanies = async () => {
    setIsRefreshing(true);
    try {
      router.refresh();
      toast.success('Companies refreshed successfully');
    } catch (error) {
      console.error('Error refreshing companies:', error);
      toast.error('Failed to refresh companies');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCompanyCreated = (company: any) => {
    // Refresh the companies data
    refreshCompanies();
  };

  const handleDeleteClick = (company: Company) => {
    setCompanyToDelete(company);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async (companyId: string, reason: string) => {
    try {
      const response = await fetch('/api/admin/delete-company', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId, reason }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(result.message);
        refreshCompanies();
      } else {
        toast.error(result.error || 'Failed to delete company');
      }
    } catch (error) {
      console.error('Error deleting company:', error);
      toast.error('An error occurred while deleting the company');
    }
  };

  const getTraineeCount = (company: Company) => {
    return company.users?.filter(u => u.role === 'trainee').length || 0;
  };

  const getAdminCount = (company: Company) => {
    return company.users?.filter(u => u.role === 'company_admin').length || 0;
  };

  return (
    <div className="space-y-6">
      {/* Create Company Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Companies ({companies.length})
              </CardTitle>
              <CardDescription>
                Manage companies and their trainee limits
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={refreshCompanies}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Refreshing...' : 'Refresh'}
              </Button>
              <Button 
                onClick={() => setIsCreateDialogOpen(true)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Company
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {companies.length === 0 ? (
            <div className="text-center py-8">
              <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No companies yet. Add your first company to get started.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {companies.map((company) => (
                <div
                  key={company.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <Building className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-medium text-gray-900">{company.name}</h3>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          company.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {company.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{company.slug}</p>
                      {company.description && (
                        <p className="text-sm text-gray-500 mt-1">{company.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {getTraineeCount(company)} trainees
                        </div>
                        <div className="flex items-center gap-1">
                          <Settings className="h-3 w-3" />
                          {getAdminCount(company)} admins
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Created {format(new Date(company.created_at), 'MMM d, yyyy')}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      Manage
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteClick(company)}
                      className={`text-red-600 hover:text-red-700 hover:bg-red-50 ${
                        deleteModalOpen && companyToDelete?.id === company.id ? 'ring-2 ring-red-500' : ''
                      }`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Company Modal */}
      <CreateCompanyModal
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onCompanyCreated={handleCompanyCreated}
      />

      {/* Delete Company Modal */}
      <DeleteCompanyModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        company={companyToDelete}
        onConfirmDelete={handleConfirmDelete}
      />
    </div>
  );
} 