'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { 
  User, 
  Building, 
  Shield, 
  Calendar, 
  Phone, 
  Mail, 
  MapPin, 
  Briefcase, 
  Save, 
  X, 
  Edit3,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingButton } from '@/components/ui/loading-button';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface UserProfile {
  id: string;
  email: string;
  role: string;
  company_id?: string;
  company_name?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  job_title?: string;
  department?: string;
  location?: string;
  date_of_birth?: string;
  is_active?: boolean;
  profile_completed?: boolean;
  last_active_at?: string;
  created_at: string;
  updated_at?: string;
}

interface Company {
  id: string;
  name: string;
  slug: string;
  max_trainees: number;
  is_active: boolean;
}

interface UserProfileManagerProps {
  user: UserProfile;
  companies: Company[];
  onClose: () => void;
  onUserUpdated: () => void;
}

export function UserProfileManager({ user, companies, onClose, onUserUpdated }: UserProfileManagerProps) {
  const { userId: currentUserId } = useAuth();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: user.first_name || '',
    last_name: user.last_name || '',
    phone: user.phone || '',
    job_title: user.job_title || '',
    department: user.department || '',
    location: user.location || '',
    date_of_birth: user.date_of_birth || '',
    company_id: user.company_id || '',
    role: user.role,
    is_active: user.is_active ?? true,
  });

  const [originalFormData, setOriginalFormData] = useState(formData);

  // Handle click outside modal
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Check if current user can edit this profile
  const canEdit = currentUserId === user.id || user.role !== 'site_admin';

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!formData.first_name.trim() || !formData.last_name.trim()) {
      toast.error('First name and last name are required');
      return;
    }

    if (formData.role === 'trainee' && !formData.company_id) {
      toast.error('Trainees must be assigned to a company');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${user.id}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update user profile');
      }

      toast.success('User profile updated successfully');
      setIsEditing(false);
      setOriginalFormData(formData);
      onUserUpdated();
    } catch (error) {
      console.error('Error updating user profile:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update user profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData(originalFormData);
    setIsEditing(false);
  };

  const handleToggleActive = async () => {
    if (!canEdit) {
      toast.error('You cannot modify this user account');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${user.id}/toggle-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !formData.is_active }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to toggle user status');
      }

      const newStatus = !formData.is_active;
      setFormData(prev => ({ ...prev, is_active: newStatus }));
      setOriginalFormData(prev => ({ ...prev, is_active: newStatus }));
      
      toast.success(`User ${newStatus ? 'activated' : 'deactivated'} successfully`);
      onUserUpdated();
    } catch (error) {
      console.error('Error toggling user status:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to toggle user status');
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'site_admin': return 'bg-purple-100 text-purple-800';
      case 'company_admin': return 'bg-green-100 text-green-800';
      case 'trainee': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge variant="default" className="bg-green-100 text-green-800">
        <CheckCircle className="h-3 w-3 mr-1" />
        Active
      </Badge>
    ) : (
      <Badge variant="secondary" className="bg-red-100 text-red-800">
        <XCircle className="h-3 w-3 mr-1" />
        Inactive
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={handleBackdropClick}>
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <User className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {user.first_name && user.last_name 
                    ? `${user.first_name} ${user.last_name}`
                    : user.email
                  }
                </h2>
                <p className="text-gray-600">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {canEdit && (
                <Button
                  onClick={() => setIsEditing(!isEditing)}
                  variant={isEditing ? "outline" : "default"}
                  size="sm"
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  {isEditing ? 'Cancel Edit' : 'Edit Profile'}
                </Button>
              )}
              <Button onClick={onClose} variant="outline" size="sm" className="flex items-center gap-2">
                <X className="h-4 w-4" />
                Close
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="first_name">First Name *</Label>
                    {isEditing ? (
                      <Input
                        id="first_name"
                        value={formData.first_name}
                        onChange={(e) => handleInputChange('first_name', e.target.value)}
                        placeholder="First name"
                      />
                    ) : (
                      <p className="text-sm text-gray-400 py-2">
                        {user.first_name || 'Not set'}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="last_name">Last Name *</Label>
                    {isEditing ? (
                      <Input
                        id="last_name"
                        value={formData.last_name}
                        onChange={(e) => handleInputChange('last_name', e.target.value)}
                        placeholder="Last name"
                      />
                    ) : (
                      <p className="text-sm text-gray-400 py-2">
                        {user.last_name || 'Not set'}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <p className="text-sm text-gray-400 py-2">{user.email}</p>
                </div>

                <div>
                  <Label htmlFor="phone">Phone</Label>
                  {isEditing ? (
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="Phone number"
                    />
                  ) : (
                    <p className="text-sm text-gray-400 py-2">
                      {user.phone || 'Not set'}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="date_of_birth">Date of Birth</Label>
                  {isEditing ? (
                    <Input
                      id="date_of_birth"
                      type="date"
                      value={formData.date_of_birth}
                      onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                    />
                  ) : (
                    <p className="text-sm text-gray-400 py-2">
                      {user.date_of_birth ? formatDate(user.date_of_birth) : 'Not set'}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Professional Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Professional Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="job_title">Job Title</Label>
                  {isEditing ? (
                    <Input
                      id="job_title"
                      value={formData.job_title}
                      onChange={(e) => handleInputChange('job_title', e.target.value)}
                      placeholder="Job title"
                    />
                  ) : (
                    <p className="text-sm text-gray-400 py-2">
                      {user.job_title || 'Not set'}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="department">Department</Label>
                  {isEditing ? (
                    <Input
                      id="department"
                      value={formData.department}
                      onChange={(e) => handleInputChange('department', e.target.value)}
                      placeholder="Department"
                    />
                  ) : (
                    <p className="text-sm text-gray-400 py-2">
                      {user.department || 'Not set'}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="location">Location</Label>
                  {isEditing ? (
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      placeholder="Location"
                    />
                  ) : (
                    <p className="text-sm text-gray-400 py-2">
                      {user.location || 'Not set'}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Account & Role Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Account & Role
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Role</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={getRoleBadgeColor(user.role)}>
                      {user.role.replace('_', ' ')}
                    </Badge>
                    {user.id === currentUserId && (
                      <Badge variant="secondary" className="text-xs">
                        You
                      </Badge>
                    )}
                  </div>
                </div>

                <div>
                  <Label>Account Status</Label>
                  <div className="flex items-center gap-2 mt-1">
                    {getStatusBadge(formData.is_active)}
                    {canEdit && (
                      <Button
                        onClick={handleToggleActive}
                        variant="outline"
                        size="sm"
                        disabled={isLoading}
                      >
                        {formData.is_active ? 'Deactivate' : 'Activate'}
                      </Button>
                    )}
                  </div>
                </div>

                <div>
                  <Label>Profile Completion</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={user.profile_completed ? "default" : "secondary"}>
                      {user.profile_completed ? 'Complete' : 'Incomplete'}
                    </Badge>
                  </div>
                </div>

                <div>
                  <Label>Last Active</Label>
                  <p className="text-sm text-gray-400 py-2">
                    {user.last_active_at ? formatDate(user.last_active_at) : 'Never'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Company Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Company Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="company">Company</Label>
                  {isEditing ? (
                    <select
                      id="company"
                      value={formData.company_id}
                      onChange={(e) => handleInputChange('company_id', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Company</option>
                      {companies.map(company => (
                        <option key={company.id} value={company.id}>
                          {company.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-sm text-gray-400 py-2">
                      {user.company_name || 'No company assigned'}
                    </p>
                  )}
                </div>

                <div>
                  <Label>Account Created</Label>
                  <p className="text-sm text-gray-400 py-2">
                    {formatDate(user.created_at)}
                  </p>
                </div>

                {user.updated_at && (
                  <div>
                    <Label>Last Updated</Label>
                    <p className="text-sm text-gray-400 py-2">
                      {formatDate(user.updated_at)}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          {isEditing && (
            <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t">
              <Button onClick={handleCancel} variant="outline">
                Cancel
              </Button>
              <LoadingButton
                onClick={handleSave}
                loading={isLoading}
                loadingText="Saving..."
              >
                Save Changes
              </LoadingButton>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 