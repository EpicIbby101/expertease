'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { LoadingButton } from '@/components/ui/loading-button';
import { Building, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Company {
  id: string;
  name: string;
  slug: string;
  description?: string;
  max_trainees: number;
  created_at: string;
  users?: Array<{ company_id: string; role: string }>;
}

interface EditCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  company: Company | null;
  onCompanyUpdated: (company: Company) => void;
}

export function EditCompanyModal({ isOpen, onClose, company, onCompanyUpdated }: EditCompanyModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    max_trainees: 10
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form data when company changes
  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name,
        slug: company.slug,
        description: company.description || '',
        max_trainees: company.max_trainees
      });
      setErrors({});
    }
  }, [company]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Company name is required';
    }
    
    if (!formData.slug.trim()) {
      newErrors.slug = 'Company slug is required';
    } else {
      const slugRegex = /^[a-z0-9-]+$/;
      if (!slugRegex.test(formData.slug)) {
        newErrors.slug = 'Company slug can only contain lowercase letters, numbers, and hyphens';
      } else if (formData.slug.length < 3) {
        newErrors.slug = 'Company slug must be at least 3 characters long';
      }
    }
    
    if (formData.max_trainees < 1 || formData.max_trainees > 1000) {
      newErrors.max_trainees = 'Maximum trainees must be between 1 and 1000';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !company) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/companies/${company.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update company');
      }

      const { company: updatedCompany } = await response.json();
      
      toast.success(`Company "${updatedCompany.name}" updated successfully!`);
      
      // Call the callback with the updated company
      onCompanyUpdated(updatedCompany);
      
      // Close modal
      onClose();
    } catch (error) {
      console.error('Error updating company:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update company');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    // Auto-generate slug if slug field is empty or matches the old name
    const slug = formData.slug === company?.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || formData.slug === '' 
      ? name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      : formData.slug;
    
    setFormData({ ...formData, name, slug });
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const slug = e.target.value;
    setFormData({ ...formData, slug });
  };

  const handleClose = () => {
    // Reset form when closing
    if (company) {
      setFormData({
        name: company.name,
        slug: company.slug,
        description: company.description || '',
        max_trainees: company.max_trainees
      });
    }
    setErrors({});
    onClose();
  };

  if (!company) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="h-5 w-5 text-blue-600" />
            Edit Company
          </DialogTitle>
          <DialogDescription>
            Update company information and settings.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Company Name *</Label>
            <Input
              id="name"
              placeholder="Acme Corporation"
              value={formData.name}
              onChange={handleNameChange}
              disabled={isLoading}
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.name}
              </p>
            )}
          </div>
          
          <div>
            <Label htmlFor="slug">Company Slug *</Label>
            <Input
              id="slug"
              placeholder="acme-corp"
              value={formData.slug}
              onChange={handleSlugChange}
              disabled={isLoading}
              className={errors.slug ? 'border-red-500' : ''}
            />
            <p className="text-xs text-gray-500 mt-1">
              URL-friendly identifier. Auto-generated from name if left empty.
            </p>
            {errors.slug && (
              <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.slug}
              </p>
            )}
          </div>
          
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Brief description of the company..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              disabled={isLoading}
              rows={3}
            />
          </div>
          
          <div>
            <Label htmlFor="max_trainees">Maximum Trainees *</Label>
            <Input
              id="max_trainees"
              type="number"
              min="1"
              max="1000"
              value={formData.max_trainees}
              onChange={(e) => setFormData({ ...formData, max_trainees: parseInt(e.target.value) || 10 })}
              disabled={isLoading}
              className={errors.max_trainees ? 'border-red-500' : ''}
            />
            {errors.max_trainees && (
              <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.max_trainees}
              </p>
            )}
          </div>

          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <LoadingButton
              type="submit"
              loading={isLoading}
              loadingText="Updating..."
              disabled={!formData.name || !formData.slug}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Update Company
            </LoadingButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
