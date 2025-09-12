'use client';

import { useState, useCallback, useMemo } from 'react';
import { useAuth } from '@clerk/nextjs';
import { X, Mail, User, Building, Shield, Plus, Phone, Briefcase, MapPin, Calendar, ChevronRight, ChevronDown, CheckCircle, AlertCircle, Users, Zap, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { LoadingButton } from '@/components/ui/loading-button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { CreateCompanyModal } from './CreateCompanyModal';

interface Company {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  max_trainees?: number;
  is_active?: boolean;
}

interface InviteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  companies: Company[];
  onInviteSuccess: () => void;
  onCompaniesUpdate?: () => void; // New prop for refreshing companies
}

export function InviteUserModal({ isOpen, onClose, companies, onInviteSuccess, onCompaniesUpdate }: InviteUserModalProps) {
  const { userId } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateCompanyModalOpen, setIsCreateCompanyModalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [showOptionalFields, setShowOptionalFields] = useState(false);
  const [emailValidation, setEmailValidation] = useState<{ isValid: boolean; message: string } | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    role: 'trainee' as 'site_admin' | 'company_admin' | 'trainee',
    companyId: '',
    // Required fields
    date_of_birth: '',
    // Optional fields
    phone: '',
    job_title: '',
    department: '',
    location: '',
  });

  // Email validation with debouncing
  const validateEmail = useCallback(async (email: string) => {
    if (!email) {
      setEmailValidation(null);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailValidation({ isValid: false, message: 'Invalid email format' });
      return;
    }

    // Check for duplicates
    try {
      const response = await fetch(`/api/admin/check-email?email=${encodeURIComponent(email)}`);
      const data = await response.json();
      
      if (data.exists) {
        setEmailValidation({ isValid: false, message: 'User already exists or invitation pending' });
      } else {
        setEmailValidation({ isValid: true, message: 'Email is available' });
      }
    } catch (error) {
      setEmailValidation({ isValid: false, message: 'Unable to verify email' });
    }
  }, []);

  // Debounced email validation
  const debouncedEmailValidation = useMemo(() => {
    let timeout: NodeJS.Timeout;
    return (email: string) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => validateEmail(email), 500);
    };
  }, [validateEmail]);

  // Smart company suggestions based on role
  const suggestedCompanies = useMemo(() => {
    if (formData.role === 'site_admin') return [];
    return companies.slice(0, 3); // Show top 3 companies
  }, [companies, formData.role]);

  // Form validation
  const isFormValid = useMemo(() => {
    const hasRequiredFields = formData.email && formData.first_name && formData.last_name && formData.date_of_birth;
    const hasValidEmail = emailValidation?.isValid;
    const hasCompanyIfNeeded = formData.role === 'site_admin' || formData.companyId;
    return hasRequiredFields && hasValidEmail && hasCompanyIfNeeded;
  }, [formData, emailValidation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate mandatory fields
    if (!formData.email || !formData.first_name || !formData.last_name || !formData.role || !formData.date_of_birth) {
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
        date_of_birth: '',
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
    
    // Special handling for email validation
    if (field === 'email') {
      debouncedEmailValidation(value);
    }
    
    // Auto-clear company when role changes to site_admin
    if (field === 'role' && value === 'site_admin') {
      setFormData(prev => ({ ...prev, companyId: '' }));
    }
  };

  const handleCompanySelection = (value: string) => {
    if (value === 'new') {
      setIsCreateCompanyModalOpen(true);
      setFormData(prev => ({ ...prev, companyId: '' }));
    } else {
      setIsCreateCompanyModalOpen(false);
      setFormData(prev => ({ ...prev, companyId: value }));
    }
  };

  const handleCompanyCreated = (company: Company) => {
    // Set the newly created company as selected
    setFormData(prev => ({ ...prev, companyId: company.id }));
    
    // Refresh the companies list
    if (onCompaniesUpdate) {
      onCompaniesUpdate();
    } else {
      onInviteSuccess(); // Fallback to existing behavior
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[95vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Enhanced Header */}
        <div className="flex items-center justify-between p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
              <Mail className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Invite New User</h2>
              <p className="text-sm text-gray-600">Send a personalized invitation to join the platform</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/50 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Enhanced Form */}
        <form onSubmit={handleSubmit} className="flex flex-col h-full max-h-[calc(95vh-120px)]">
          <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            <div className="space-y-8">
              
              {/* Step 1: Basic Information */}
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-blue-600">1</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
                </div>

                {/* Email with Real-time Validation */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                    Email Address *
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="john.doe@company.com"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className={`pl-10 ${emailValidation?.isValid === false ? 'border-red-300 focus:border-red-500' : emailValidation?.isValid === true ? 'border-green-300 focus:border-green-500' : ''}`}
                      required
                    />
                    {emailValidation && (
                      <div className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${emailValidation.isValid ? 'text-green-500' : 'text-red-500'}`}>
                        {emailValidation.isValid ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                      </div>
                    )}
                  </div>
                  {emailValidation && (
                    <p className={`text-xs ${emailValidation.isValid ? 'text-green-600' : 'text-red-600'}`}>
                      {emailValidation.message}
                    </p>
                  )}
                </div>

                {/* Name Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first_name" className="text-sm font-medium text-gray-700">
                      First Name *
                    </Label>
                    <Input
                      id="first_name"
                      type="text"
                      placeholder="John"
                      value={formData.first_name}
                      onChange={(e) => handleInputChange('first_name', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name" className="text-sm font-medium text-gray-700">
                      Last Name *
                    </Label>
                    <Input
                      id="last_name"
                      type="text"
                      placeholder="Doe"
                      value={formData.last_name}
                      onChange={(e) => handleInputChange('last_name', e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Date of Birth */}
                <div className="space-y-2">
                  <Label htmlFor="date_of_birth" className="text-sm font-medium text-gray-700">
                    Date of Birth *
                  </Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      id="date_of_birth"
                      type="date"
                      value={formData.date_of_birth}
                      onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Step 2: Role & Company */}
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-blue-600">2</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Role & Access</h3>
                </div>

                {/* Enhanced Role Selection */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-700">Select Role *</Label>
                  <div className="grid gap-3">
                    <label className={`relative flex items-start gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all hover:shadow-md ${formData.role === 'site_admin' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <input
                        type="radio"
                        name="role"
                        value="site_admin"
                        checked={formData.role === 'site_admin'}
                        onChange={(e) => handleInputChange('role', e.target.value)}
                        className="mt-1 text-blue-600"
                      />
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <Shield className="h-5 w-5 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900">Site Administrator</div>
                          <div className="text-sm text-gray-600 mt-1">Full system access, user management, and platform administration</div>
                          <Badge variant="secondary" className="mt-2 bg-purple-100 text-purple-700">Highest Privileges</Badge>
                        </div>
                      </div>
                    </label>

                    <label className={`relative flex items-start gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all hover:shadow-md ${formData.role === 'company_admin' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <input
                        type="radio"
                        name="role"
                        value="company_admin"
                        checked={formData.role === 'company_admin'}
                        onChange={(e) => handleInputChange('role', e.target.value)}
                        className="mt-1 text-blue-600"
                      />
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <Building className="h-5 w-5 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900">Company Administrator</div>
                          <div className="text-sm text-gray-600 mt-1">Manage company users, settings, and training programs</div>
                          <Badge variant="secondary" className="mt-2 bg-green-100 text-green-700">Company Level</Badge>
                        </div>
                      </div>
                    </label>

                    <label className={`relative flex items-start gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all hover:shadow-md ${formData.role === 'trainee' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <input
                        type="radio"
                        name="role"
                        value="trainee"
                        checked={formData.role === 'trainee'}
                        onChange={(e) => handleInputChange('role', e.target.value)}
                        className="mt-1 text-blue-600"
                      />
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-orange-100 rounded-lg">
                          <User className="h-5 w-5 text-orange-600" />
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900">Trainee</div>
                          <div className="text-sm text-gray-600 mt-1">Access to training materials, courses, and assessments</div>
                          <Badge variant="secondary" className="mt-2 bg-orange-100 text-orange-700">Standard Access</Badge>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Company Selection with Smart Suggestions */}
                {(formData.role === 'company_admin' || formData.role === 'trainee') && (
                  <div className="space-y-4">
                    <Label className="text-sm font-medium text-gray-700">Company Assignment *</Label>
                    
                    {!isCreateCompanyModalOpen ? (
                      <div className="space-y-3">
                        {/* Quick Company Selection */}
                        {suggestedCompanies.length > 0 && (
                          <div>
                            <p className="text-xs text-gray-500 mb-2">Quick Select:</p>
                            <div className="flex gap-2 flex-wrap">
                              {suggestedCompanies.map(company => (
                                <Button
                                  key={company.id}
                                  type="button"
                                  variant={formData.companyId === company.id ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => handleInputChange('companyId', company.id)}
                                  className="text-xs"
                                >
                                  {company.name}
                                </Button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Full Company Dropdown */}
                        <select
                          value={formData.companyId}
                          onChange={(e) => handleCompanySelection(e.target.value)}
                          className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        >
                          <option value="">Select a company</option>
                          {(companies || []).map(company => (
                            <option key={company.id} value={company.id}>
                              {company.name}
                            </option>
                          ))}
                          <option value="new" className="font-medium text-blue-600">
                            ➕ Create New Company
                          </option>
                        </select>
                        
                        {formData.companyId && companies.find(c => c.id === formData.companyId) && (
                          <Card className="bg-green-50 border-green-200">
                            <CardContent className="p-3">
                              <div className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <span className="text-sm font-medium text-green-800">
                                  Selected: {companies.find(c => c.id === formData.companyId)?.name}
                                </span>
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    ) : (
                      <CreateCompanyModal
                        isOpen={isCreateCompanyModalOpen}
                        onClose={() => setIsCreateCompanyModalOpen(false)}
                        onCompanyCreated={handleCompanyCreated}
                      />
                    )}
                  </div>
                )}
              </div>

              {/* Step 3: Additional Information (Collapsible) */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-gray-600">3</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Additional Information</h3>
                  <Badge variant="secondary" className="text-xs">Optional</Badge>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowOptionalFields(!showOptionalFields)}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
                >
                  {showOptionalFields ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  {showOptionalFields ? 'Hide' : 'Show'} Optional Fields
                </Button>

                {showOptionalFields && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                        Phone Number
                      </Label>
                      <div className="relative">
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

                    <div className="space-y-2">
                      <Label htmlFor="job_title" className="text-sm font-medium text-gray-700">
                        Job Title
                      </Label>
                      <div className="relative">
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

                    <div className="space-y-2">
                      <Label htmlFor="department" className="text-sm font-medium text-gray-700">
                        Department
                      </Label>
                      <Input
                        id="department"
                        type="text"
                        placeholder="Engineering"
                        value={formData.department}
                        onChange={(e) => handleInputChange('department', e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="location" className="text-sm font-medium text-gray-700">
                        Location
                      </Label>
                      <div className="relative">
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
                )}
              </div>

              {/* Enhanced Info Box */}
              <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Zap className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-blue-900">What happens next?</h4>
                      <ul className="text-sm text-blue-800 mt-2 space-y-1">
                        <li className="flex items-center gap-2">
                          <ArrowRight className="h-3 w-3" />
                          Personalized invitation email sent instantly
                        </li>
                        <li className="flex items-center gap-2">
                          <ArrowRight className="h-3 w-3" />
                          User can accept and create their account
                        </li>
                        <li className="flex items-center gap-2">
                          <ArrowRight className="h-3 w-3" />
                          Profile pre-filled with provided information
                        </li>
                        <li className="flex items-center gap-2">
                          <ArrowRight className="h-3 w-3" />
                          Invitation expires in 7 days
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Enhanced Actions */}
          <div className="border-t bg-gray-50 p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Users className="h-4 w-4" />
                <span>Invitation will be sent to: {formData.email || 'user@example.com'}</span>
              </div>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isLoading}
                  className="px-6"
                >
                  Cancel
                </Button>
                <LoadingButton
                  type="submit"
                  loading={isLoading}
                  loadingText="Sending Invitation..."
                  disabled={!isFormValid || isCreateCompanyModalOpen}
                  className="px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  Send Invitation
                </LoadingButton>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Create Company Modal */}
      <CreateCompanyModal
        isOpen={isCreateCompanyModalOpen}
        onClose={() => setIsCreateCompanyModalOpen(false)}
        onCompanyCreated={handleCompanyCreated}
      />
    </div>
  );
} 