'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingButton } from '@/components/ui/loading-button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Building, Plus, Trash2, Users, Calendar, Settings, RefreshCw, Edit, Eye, MoreHorizontal, Search, Filter, Download, Upload, ArrowUpDown } from 'lucide-react';
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
  
  // Filtering and search state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'created_at' | 'userCount' | 'max_trainees'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);

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

  // Filter and sort companies
  const filteredAndSortedCompanies = useMemo(() => {
    let filtered = companies.filter(company => {
      const matchesSearch = company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           company.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (company.description && company.description.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = statusFilter === 'all' || 
                           (statusFilter === 'active' && company.is_active) ||
                           (statusFilter === 'inactive' && !company.is_active);
      
      return matchesSearch && matchesStatus;
    });

    // Sort companies
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'created_at':
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
          break;
        case 'userCount':
          aValue = a.users?.length || 0;
          bValue = b.users?.length || 0;
          break;
        case 'max_trainees':
          aValue = a.max_trainees;
          bValue = b.max_trainees;
          break;
        default:
          return 0;
      }
      
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [companies, searchTerm, statusFilter, sortBy, sortOrder]);

  // Bulk operations
  const selectAllCompanies = () => {
    if (selectedCompanies.length === filteredAndSortedCompanies.length) {
      setSelectedCompanies([]);
    } else {
      setSelectedCompanies(filteredAndSortedCompanies.map(c => c.id));
    }
  };

  const toggleCompanySelection = (companyId: string) => {
    setSelectedCompanies(prev => 
      prev.includes(companyId) 
        ? prev.filter(id => id !== companyId)
        : [...prev, companyId]
    );
  };

  const handleBulkDelete = async () => {
    if (selectedCompanies.length === 0) return;
    
    try {
      const promises = selectedCompanies.map(companyId => 
        fetch('/api/admin/delete-company', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            companyId, 
            reason: `Bulk deletion - ${selectedCompanies.length} companies selected` 
          }),
        })
      );
      
      await Promise.all(promises);
      toast.success(`${selectedCompanies.length} companies deleted successfully`);
      setSelectedCompanies([]);
      refreshCompanies();
    } catch (error) {
      console.error('Error in bulk delete:', error);
      toast.error('Failed to delete selected companies');
    }
  };

  const handleBulkExport = () => {
    if (selectedCompanies.length === 0) return;
    
    const selectedCompaniesData = filteredAndSortedCompanies
      .filter(c => selectedCompanies.includes(c.id))
      .map(company => ({
        name: company.name,
        slug: company.slug,
        description: company.description || '',
        max_trainees: company.max_trainees,
        is_active: company.is_active,
        trainee_count: getTraineeCount(company),
        admin_count: getAdminCount(company),
        created_at: format(new Date(company.created_at), 'yyyy-MM-dd HH:mm:ss')
      }));
    
    const csvContent = [
      Object.keys(selectedCompaniesData[0]).join(','),
      ...selectedCompaniesData.map(row => Object.values(row).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `companies_export_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success(`Exported ${selectedCompanies.length} companies`);
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
          {/* Search and Filter Controls */}
          {companies && companies.length > 0 && (
            <div className="mb-6 space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search companies by name, slug, or description..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Companies</SelectItem>
                    <SelectItem value="active">Active Only</SelectItem>
                    <SelectItem value="inactive">Inactive Only</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="created_at">Created Date</SelectItem>
                    <SelectItem value="userCount">User Count</SelectItem>
                    <SelectItem value="max_trainees">Max Trainees</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="flex items-center gap-2"
                >
                  <ArrowUpDown className="h-4 w-4" />
                  {sortOrder === 'asc' ? 'Asc' : 'Desc'}
                </Button>
              </div>
              
              {/* Bulk Operations Toolbar */}
              {selectedCompanies.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-blue-900">
                        {selectedCompanies.length} company{selectedCompanies.length !== 1 ? 'ies' : ''} selected
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleBulkExport}
                        className="text-blue-700 border-blue-300 hover:bg-blue-100"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export Selected
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleBulkDelete}
                        className="text-red-700 border-red-300 hover:bg-red-100"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Selected
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedCompanies([])}
                      >
                        Clear Selection
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {!companies || companies.length === 0 ? (
            <div className="text-center py-8">
              <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No companies yet. Add your first company to get started.</p>
            </div>
          ) : filteredAndSortedCompanies.length === 0 ? (
            <div className="text-center py-8">
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No companies match your search criteria.</p>
              <Button variant="outline" onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
              }}>
                Clear Filters
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Select All Checkbox */}
              <div className="flex items-center gap-3 p-3 border-b border-gray-200">
                <Checkbox
                  checked={selectedCompanies.length === filteredAndSortedCompanies.length && filteredAndSortedCompanies.length > 0}
                  onCheckedChange={selectAllCompanies}
                />
                <span className="text-sm font-medium text-gray-700">
                  Select All ({filteredAndSortedCompanies.length} companies)
                </span>
              </div>
              
              {filteredAndSortedCompanies.map((company) => (
                <div
                  key={company.id}
                  className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                    selectedCompanies.includes(company.id) 
                      ? 'bg-blue-50 border-blue-200 shadow-md' 
                      : 'bg-white hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <Checkbox
                      checked={selectedCompanies.includes(company.id)}
                      onCheckedChange={() => toggleCompanySelection(company.id)}
                    />
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