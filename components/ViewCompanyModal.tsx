'use client';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building, Users, Settings, Calendar, User, Award, Trash2, Edit } from 'lucide-react';
import { format } from 'date-fns';

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

interface ViewCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  company: Company | null;
  onEdit?: (company: Company) => void;
  onDelete?: (company: Company) => void;
}

export function ViewCompanyModal({ isOpen, onClose, company, onEdit, onDelete }: ViewCompanyModalProps) {
  if (!company) return null;

  const getTraineeCount = (company: Company) => {
    return company.users?.filter(u => u.role === 'trainee').length || 0;
  };

  const getAdminCount = (company: Company) => {
    return company.users?.filter(u => u.role === 'company_admin').length || 0;
  };

  const getSiteAdminCount = (company: Company) => {
    return company.users?.filter(u => u.role === 'site_admin').length || 0;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="h-5 w-5 text-blue-600" />
            {company.name}
          </DialogTitle>
          <DialogDescription>
            View company details and user statistics
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Company Overview */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    company.is_active ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    <Building className={`h-6 w-6 ${company.is_active ? 'text-blue-600' : 'text-gray-400'}`} />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">{company.name}</h3>
                    <p className="text-sm text-gray-400">{company.slug}</p>
                  </div>
                </div>
                <Badge className={
                  company.is_active 
                    ? 'bg-green-100 text-green-800 border-green-200' 
                    : 'bg-red-100 text-red-800 border-red-200'
                }>
                  {company.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {company.description && (
                <div className="mb-4">
                  <h4 className="font-medium text-white mb-2">Description</h4>
                  <p className="text-gray-400">{company.description}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-500">Created:</span>
                  <span className="font-medium">{format(new Date(company.created_at), 'MMM d, yyyy')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-500">Max Trainees:</span>
                  <span className="font-medium">{company.max_trainees}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* User Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                User Statistics
              </CardTitle>
              <CardDescription>
                Current user distribution and limits
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{getTraineeCount(company)}</div>
                  <div className="text-sm text-blue-800">Trainees</div>
                  <div className="text-xs text-blue-600">of {company.max_trainees} max</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{getAdminCount(company)}</div>
                  <div className="text-sm text-green-800">Company Admins</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{getSiteAdminCount(company)}</div>
                  <div className="text-sm text-purple-800">Site Admins</div>
                </div>
              </div>
              
              {/* Usage Bar */}
              <div className="mt-4">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Trainee Usage</span>
                  <span>{getTraineeCount(company)} / {company.max_trainees}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      getTraineeCount(company) / company.max_trainees > 0.8 
                        ? 'bg-red-500' 
                        : getTraineeCount(company) / company.max_trainees > 0.6 
                        ? 'bg-yellow-500' 
                        : 'bg-green-500'
                    }`}
                    style={{ 
                      width: `${Math.min((getTraineeCount(company) / company.max_trainees) * 100, 100)}%` 
                    }}
                  />
                </div>
                {getTraineeCount(company) / company.max_trainees > 0.8 && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <Award className="h-3 w-3" />
                    Near capacity limit
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* User List */}
          {company.users && company.users.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-600" />
                  Company Users
                </CardTitle>
                <CardDescription>
                  All users associated with this company
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {company.users.map((user, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-gray-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">User {index + 1}</div>
                          <div className="text-sm text-gray-500">Role: {user.role}</div>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {user.role.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {onEdit && (
            <Button onClick={() => onEdit(company)} className="flex items-center gap-2">
              <Edit className="h-4 w-4" />
              Edit Company
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
