'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { LoadingButton } from '@/components/ui/loading-button';
import { Building, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface Company {
  id: string;
  name: string;
  slug: string;
  description?: string;
  max_trainees: number;
  is_active: boolean;
}

interface CreateCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCompanyCreated: (company: Company) => void;
}

export function CreateCompanyModal({ isOpen, onClose, onCompanyCreated }: CreateCompanyModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    max_trainees: 10
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Company name is required');
      return;
    }

    if (!formData.slug.trim()) {
      toast.error('Company slug is required');
      return;
    }

    // Validate slug format
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(formData.slug)) {
      toast.error('Company slug can only contain lowercase letters, numbers, and hyphens');
      return;
    }

    // Validate slug length
    if (formData.slug.length < 3) {
      toast.error('Company slug must be at least 3 characters long');
      return;
    }

    // Validate max trainees
    if (formData.max_trainees < 1 || formData.max_trainees > 1000) {
      toast.error('Maximum trainees must be between 1 and 1000');
      return;
    }

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

      const { company } = await response.json();
      
      toast.success(`Company "${company.name}" created successfully!`);
      
      // Call the callback with the new company
      onCompanyCreated(company);
      
      // Reset form and close modal
      setFormData({ name: '', slug: '', description: '', max_trainees: 10 });
      onClose();
    } catch (error) {
      console.error('Error creating company:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create company');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    // Auto-generate slug if slug field is empty
    const slug = formData.slug || name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    
    setFormData({ ...formData, name, slug });
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const slug = e.target.value;
    setFormData({ ...formData, slug });
  };

  const handleClose = () => {
    // Reset form when closing
    setFormData({ name: '', slug: '', description: '', max_trainees: 10 });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="h-5 w-5 text-blue-600" />
            Create New Company
          </DialogTitle>
          <DialogDescription>
            Create a new company and set their trainee limits.
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
              required
            />
          </div>
          
          <div>
            <Label htmlFor="slug">Company Slug *</Label>
            <Input
              id="slug"
              placeholder="acme-corp"
              value={formData.slug}
              onChange={handleSlugChange}
              disabled={isLoading}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              URL-friendly identifier. Auto-generated from name if left empty.
            </p>
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
              loadingText="Creating..."
              disabled={!formData.name || !formData.slug}
            >
              Create Company
            </LoadingButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 