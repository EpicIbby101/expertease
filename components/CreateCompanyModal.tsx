'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { LoadingButton } from '@/components/ui/loading-button';
import { Building, Plus, CheckCircle, AlertCircle, Info, ArrowRight, ArrowLeft } from 'lucide-react';
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
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    max_trainees: 10
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateStep = (step: number) => {
    const newErrors: Record<string, string> = {};
    
    if (step === 1) {
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
    }
    
    if (step === 2) {
      if (formData.max_trainees < 1 || formData.max_trainees > 1000) {
        newErrors.max_trainees = 'Maximum trainees must be between 1 and 1000';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 3));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

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
    // Reset form and step when closing
    setFormData({ name: '', slug: '', description: '', max_trainees: 10 });
    setCurrentStep(1);
    setErrors({});
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="h-5 w-5 text-blue-600" />
            Create New Company
          </DialogTitle>
          <DialogDescription>
            Set up a new company with their basic information and trainee limits.
          </DialogDescription>
        </DialogHeader>
        
        {/* Progress Steps */}
        <div className="flex items-center justify-center space-x-4 py-4">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step <= currentStep 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-500'
              }`}>
                {step < currentStep ? <CheckCircle className="h-4 w-4" /> : step}
              </div>
              {step < 3 && (
                <div className={`w-12 h-0.5 mx-2 ${
                  step < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-white">Basic Information</h3>
                <p className="text-sm text-gray-400">Enter the company's name and URL identifier</p>
              </div>
              
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
                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                  <Info className="h-3 w-3" />
                  URL-friendly identifier. Auto-generated from name if left empty.
                </p>
                {errors.slug && (
                  <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.slug}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Description */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-white">Description</h3>
                <p className="text-sm text-gray-400">Add a brief description of the company (optional)</p>
              </div>
              
              <div>
                <Label htmlFor="description">Company Description</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of the company..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  disabled={isLoading}
                  rows={4}
                />
                <p className="text-xs text-gray-500 mt-1">
                  This will help identify the company and its purpose.
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Trainee Limits */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-white">Trainee Limits</h3>
                <p className="text-sm text-gray-400">Set the maximum number of trainees for this company</p>
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
                <p className="text-xs text-gray-500 mt-1">
                  This limits how many trainees can be assigned to this company.
                </p>
                {errors.max_trainees && (
                  <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.max_trainees}
                  </p>
                )}
              </div>

              {/* Summary Card */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Company Summary</h4>
                <div className="space-y-1 text-sm text-blue-800">
                  <p><strong>Name:</strong> {formData.name}</p>
                  <p><strong>Slug:</strong> {formData.slug}</p>
                  {formData.description && <p><strong>Description:</strong> {formData.description}</p>}
                  <p><strong>Max Trainees:</strong> {formData.max_trainees}</p>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter className="flex justify-between">
            <div>
              {currentStep > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Previous
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              {currentStep < 3 ? (
                <Button
                  type="button"
                  onClick={nextStep}
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  Next
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <LoadingButton
                  type="submit"
                  loading={isLoading}
                  loadingText="Creating..."
                >
                  <Building className="h-4 w-4 mr-2" />
                  Create Company
                </LoadingButton>
              )}
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 