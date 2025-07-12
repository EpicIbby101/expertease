'use client';

import { useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { X, Mail, User, Building, Shield, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
    role: 'trainee' as 'site_admin' | 'company_admin' | 'trainee',
    companyId: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.role) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Please enter a valid email address');
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

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send invitation');
      }

      toast.success('Invitation sent successfully!');
      setFormData({ email: '', role: 'trainee', companyId: '' });
      onInviteSuccess();
      onClose();
    } catch (error) {
      console.error('Error sending invitation:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to send invitation');
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
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
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
          {/* Email Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address *
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="email"
                placeholder="user@example.com"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role *
            </label>
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company *
              </label>
              
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