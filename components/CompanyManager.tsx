'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Building, Plus, Trash2, Users, Calendar, Settings } from 'lucide-react';
import { format } from 'date-fns';

interface Company {
  id: string;
  name: string;
  slug: string;
  description?: string;
  max_trainees: number;
  is_active: boolean;
  created_at: string;
  users?: Array<{ id: string; role: string }>;
}

interface CompanyManagerProps {
  companies: Company[];
}

export function CompanyManager({ companies }: CompanyManagerProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    max_trainees: 10
  });
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const createCompany = async () => {
    if (!formData.name || !formData.slug) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/create-company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create company');
      }

      // Reset form and close dialog
      setFormData({ name: '', slug: '', description: '', max_trainees: 10 });
      setIsCreateDialogOpen(false);
      
      // Refresh the page to show new company
      window.location.reload();
    } catch (error) {
      console.error('Error creating company:', error);
      alert(error instanceof Error ? error.message : 'Failed to create company');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteCompany = async (companyId: string) => {
    if (!confirm('Are you sure you want to delete this company? This will also delete all associated users.')) return;
    
    setDeletingId(companyId);
    try {
      const response = await fetch('/api/admin/delete-company', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete company');
      }

      // Refresh the page to show updated list
      window.location.reload();
    } catch (error) {
      console.error('Error deleting company:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete company');
    } finally {
      setDeletingId(null);
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
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add Company
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Company</DialogTitle>
                  <DialogDescription>
                    Create a new company and set their trainee limits.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Company Name</Label>
                    <Input
                      id="name"
                      placeholder="Acme Corporation"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <Label htmlFor="slug">Company Slug</Label>
                    <Input
                      id="slug"
                      placeholder="acme-corp"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Brief description of the company..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <Label htmlFor="max_trainees">Maximum Trainees</Label>
                    <Input
                      id="max_trainees"
                      type="number"
                      min="1"
                      value={formData.max_trainees}
                      onChange={(e) => setFormData({ ...formData, max_trainees: parseInt(e.target.value) || 10 })}
                      disabled={isLoading}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={createCompany}
                    disabled={!formData.name || !formData.slug || isLoading}
                  >
                    {isLoading ? 'Creating...' : 'Create Company'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
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
                      onClick={() => deleteCompany(company.id)}
                      disabled={deletingId === company.id}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      {deletingId === company.id ? (
                        'Deleting...'
                      ) : (
                        <>
                          <Trash2 className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 