'use client';

import { useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { X, Mail, User, Building, Shield, Plus, Phone, Briefcase, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

interface Company {
  id: string;
  name: string;
}

interface InviteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  companies: Company[];
  onInviteSuccess: () => void;
}

export function InviteUserModal({ isOpen, onClose, companies, onInviteSuccess }: InviteUserModalProps) {
  const { userId } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingCompany, setIsCreatingCompany] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    role: 'trainee' as 'site_admin' | 'company_admin' | 'trainee',
    companyId: '',
    // Optional fields
    phone: '',
    job_title: '',
    department: '',
    location: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate mandatory fields
    if (!formData.email || !formData.first_name || !formData.last_name || !formData.role) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    // Name validation
    if (formData.first_name.trim().length < 2) {
      toast.error('First name must be at least 2 characters');
      return;
    }

    if (formData.last_name.trim().length < 2) {
      toast.error('Last name must be at least 2 characters');
      return;
    }

    // Company validation for company_admin and trainee roles
    if ((formData.role === 'company_admin' || formData.role === 'trainee') && !formData.companyId) {
      toast.error('Please select a company for this role');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/invite-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (!response.ok) {
        // Show both error and details if present
        throw new Error(data.error + (data.details ? `: ${data.details}` : ''));
      }

      toast.success('Invitation sent successfully!');
      setFormData({ 
        email: '', 
        first_name: '', 
        last_name: '', 
        role: 'trainee', 
        companyId: '', 
        phone: '', 
        job_title: '', 
        department: '', 
        location: '' 
      });
      onInviteSuccess();
      onClose();
    } catch (err) {
      // Show the full error message
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCreateCompany = async () => {
    if (!newCompanyName.trim()) {
      toast.error('Please enter a company name');
      return;
    }

    setIsCreatingCompany(true);
    try {
      const response = await fetch('/api/admin/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCompanyName.trim() }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create company');
      }

      const { company } = await response.json();
      
      // Add the new company to the list and select it
      const updatedCompanies = [...companies, company];
      setFormData(prev => ({ ...prev, companyId: company.id }));
      setNewCompanyName('');
      setIsCreatingCompany(false);
      
      toast.success(`Company "${company.name}" created successfully!`);
      
      // Refresh the companies list
      onInviteSuccess();
    } catch (error) {
      console.error('Error creating company:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create company');
    } finally {
      setIsCreatingCompany(false);
    }
  };

  const handleCompanySelection = (value: string) => {
    if (value === 'new') {
      setIsCreatingCompany(true);
      setFormData(prev => ({ ...prev, companyId: '' }));
    } else {
      setIsCreatingCompany(false);
      setFormData(prev => ({ ...prev, companyId: value }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Mail className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Invite User</h2>
              <p className="text-sm text-gray-500">Send an invitation to join the platform</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Required Information Section */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Required Information</h3>
            
            {/* Email Input */}
            <div className="mb-4">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email Address *
              </Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <Label htmlFor="first_name" className="text-sm font-medium text-gray-700">
                  First Name *
                </Label>
                <Input
                  id="first_name"
                  type="text"
                  placeholder="John"
                  value={formData.first_name}
                  onChange={(e) => handleInputChange('first_name', e.target.value)}
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <Label htmlFor="last_name" className="text-sm font-medium text-gray-700">
                  Last Name *
                </Label>
                <Input
                  id="last_name"
                  type="text"
                  placeholder="Doe"
                  value={formData.last_name}
                  onChange={(e) => handleInputChange('last_name', e.target.value)}
                  className="mt-1"
                  required
                />
              </div>
            </div>

            {/* Role Selection */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-3 block">
                Role *
              </Label>
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="role"
                    value="site_admin"
                    checked={formData.role === 'site_admin'}
                    onChange={(e) => handleInputChange('role', e.target.value)}
                    className="text-blue-600"
                  />
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-purple-600" />
                    <div>
                      <div className="font-medium text-gray-900">Site Administrator</div>
                      <div className="text-sm text-gray-500">Full system access and user management</div>
                    </div>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="role"
                    value="company_admin"
                    checked={formData.role === 'company_admin'}
                    onChange={(e) => handleInputChange('role', e.target.value)}
                    className="text-blue-600"
                  />
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-green-600" />
                    <div>
                      <div className="font-medium text-gray-900">Company Administrator</div>
                      <div className="text-sm text-gray-500">Manage company users and settings</div>
                    </div>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="role"
                    value="trainee"
                    checked={formData.role === 'trainee'}
                    onChange={(e) => handleInputChange('role', e.target.value)}
                    className="text-blue-600"
                  />
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-orange-600" />
                    <div>
                      <div className="font-medium text-gray-900">Trainee</div>
                      <div className="text-sm text-gray-500">Access to training materials and courses</div>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Company Selection */}
            {(formData.role === 'company_admin' || formData.role === 'trainee') && (
              <div className="mt-4">
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  Company *
                </Label>
                
                {!isCreatingCompany ? (
                  <select
                    value={formData.companyId}
                    onChange={(e) => handleCompanySelection(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select a company</option>
                    {companies.map(company => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                      </option>
                    ))}
                    <option value="new" className="font-medium text-blue-600">
                      ➕ Create New Company
                    </option>
                  </select>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Plus className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-600">Create New Company</span>
                    </div>
                    
                    <div className="space-y-2">
                      <Input
                        type="text"
                        placeholder="Enter company name"
                        value={newCompanyName}
                        onChange={(e) => setNewCompanyName(e.target.value)}
                        className="w-full"
                      />
                      
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          onClick={handleCreateCompany}
                          disabled={isCreatingCompany || !newCompanyName.trim()}
                          size="sm"
                          className="flex-1"
                        >
                          {isCreatingCompany ? 'Creating...' : 'Create Company'}
                        </Button>
                        
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setIsCreatingCompany(false);
                            setNewCompanyName('');
                            setFormData(prev => ({ ...prev, companyId: '' }));
                          }}
                          size="sm"
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <Separator />

          {/* Optional Information Section */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Information (Optional)</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Phone */}
              <div>
                <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                  Phone Number
                </Label>
                <div className="relative mt-1">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Job Title */}
              <div>
                <Label htmlFor="job_title" className="text-sm font-medium text-gray-700">
                  Job Title
                </Label>
                <div className="relative mt-1">
                  <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="job_title"
                    type="text"
                    placeholder="Software Engineer"
                    value={formData.job_title}
                    onChange={(e) => handleInputChange('job_title', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Department */}
              <div>
                <Label htmlFor="department" className="text-sm font-medium text-gray-700">
                  Department
                </Label>
                <Input
                  id="department"
                  type="text"
                  placeholder="Engineering"
                  value={formData.department}
                  onChange={(e) => handleInputChange('department', e.target.value)}
                  className="mt-1"
                />
              </div>

              {/* Location */}
              <div>
                <Label htmlFor="location" className="text-sm font-medium text-gray-700">
                  Location
                </Label>
                <div className="relative mt-1">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="location"
                    type="text"
                    placeholder="San Francisco, CA"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="p-1 bg-blue-100 rounded">
                <Mail className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-blue-900">What happens next?</h4>
                <ul className="text-sm text-blue-800 mt-1 space-y-1">
                  <li>• An invitation email will be sent to the user</li>
                  <li>• The user can accept the invitation and create their account</li>
                  <li>• Their profile will be pre-filled with the information provided</li>
                  <li>• The invitation expires in 7 days</li>
                  <li>• You can track invitation status in the invitations list</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isLoading || isCreatingCompany}
            >
              {isLoading ? 'Sending...' : 'Send Invitation'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 