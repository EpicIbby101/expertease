'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingButton } from '@/components/ui/loading-button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Building, Plus, Trash2, Users, Calendar, Settings, RefreshCw, Edit, Eye, MoreHorizontal } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { CreateCompanyModal } from './CreateCompanyModal';
import { DeleteCompanyModal } from './DeleteCompanyModal';
import { ViewCompanyModal } from './ViewCompanyModal';
import { EditCompanyModal } from './EditCompanyModal';

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
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [companyToView, setCompanyToView] = useState<Company | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [companyToEdit, setCompanyToEdit] = useState<Company | null>(null);

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

  const handleCompanyUpdated = (company: any) => {
    // Refresh the companies data
    refreshCompanies();
  };

  const handleDeleteClick = (company: Company) => {
    setCompanyToDelete(company);
    setDeleteModalOpen(true);
  };

  const handleViewClick = (company: Company) => {
    setCompanyToView(company);
    setViewModalOpen(true);
  };

  const handleEditClick = (company: Company) => {
    setCompanyToEdit(company);
    setEditModalOpen(true);
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
                Companies ({companies?.length || 0})
              </CardTitle>
              <CardDescription>
                Manage companies and their trainee limits
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <LoadingButton 
                variant="outline" 
                size="sm" 
                onClick={refreshCompanies}
                loading={isRefreshing}
                loadingText="Refreshing..."
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </LoadingButton>
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
          {!companies || companies.length === 0 ? (
            <div className="text-center py-8">
              <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No companies yet. Add your first company to get started.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(companies || []).map((company) => (
                <div
                  key={company.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-white hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      company.is_active ? 'bg-blue-100' : 'bg-gray-100'
                    }`}>
                      <Building className={`h-6 w-6 ${company.is_active ? 'text-blue-600' : 'text-gray-400'}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{company.name}</h3>
                        <Badge variant="outline" className="text-xs text-gray-500">
                          {company.slug}
                        </Badge>
                        <Badge className={
                          company.is_active 
                            ? 'bg-green-100 text-green-800 border-green-200' 
                            : 'bg-red-100 text-red-800 border-red-200'
                        }>
                          {company.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      {company.description && (
                        <p className="text-sm text-gray-600 mb-2">{company.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span className="font-medium">{getTraineeCount(company)}</span>
                          <span>trainees</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Settings className="h-4 w-4" />
                          <span className="font-medium">{getAdminCount(company)}</span>
                          <span>admins</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>Created {format(new Date(company.created_at), 'MMM d, yyyy')}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Building className="h-4 w-4" />
                          <span className="font-medium">{company.max_trainees}</span>
                          <span>max trainees</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex items-center gap-2"
                      onClick={() => handleViewClick(company)}
                    >
                      <Eye className="h-4 w-4" />
                      View
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex items-center gap-2"
                      onClick={() => handleEditClick(company)}
                    >
                      <Edit className="h-4 w-4" />
                      Edit
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleDeleteClick(company)} className="text-red-600 hover:text-red-700">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Company
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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

      {/* View Company Modal */}
      <ViewCompanyModal
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        company={companyToView}
        onEdit={handleEditClick}
        onDelete={handleDeleteClick}
      />

      {/* Edit Company Modal */}
      <EditCompanyModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        company={companyToEdit}
        onCompanyUpdated={handleCompanyUpdated}
      />
    </div>
  );
} 