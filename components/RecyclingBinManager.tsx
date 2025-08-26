'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, RotateCcw, Clock, AlertTriangle, Building, Calendar, User } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface DeletedCompany {
  id: string;
  name: string;
  slug: string;
  description?: string;
  max_trainees: number;
  is_active: boolean;
  created_at: string;
  deleted_at: string;
  deleted_by?: string;
  deleted_reason?: string;
  deleted_by_user?: {
    name: string;
    email: string;
  };
}

interface RecyclingBinManagerProps {
  deletedCompanies: DeletedCompany[];
}

export function RecyclingBinManager({ deletedCompanies }: RecyclingBinManagerProps) {
  const router = useRouter();
  const [isRecovering, setIsRecovering] = useState<string | null>(null);
  const [isPermanentlyDeleting, setIsPermanentlyDeleting] = useState<string | null>(null);

  const isRecoverable = (deletedAt: string) => {
    const deletedDate = new Date(deletedAt);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return deletedDate > thirtyDaysAgo;
  };

  const handleRecover = async (companyId: string) => {
    setIsRecovering(companyId);
    try {
      const response = await fetch('/api/admin/recover-company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to recover company');
      }
    } catch (error) {
      console.error('Error recovering company:', error);
      toast.error('An error occurred while recovering the company');
    } finally {
      setIsRecovering(null);
    }
  };

  const handlePermanentDelete = async (companyId: string) => {
    if (!confirm('Are you sure you want to permanently delete this company? This action cannot be undone.')) {
      return;
    }

    setIsPermanentlyDeleting(companyId);
    try {
      const response = await fetch('/api/admin/permanently-delete-company', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to permanently delete company');
      }
    } catch (error) {
      console.error('Error permanently deleting company:', error);
      toast.error('An error occurred while permanently deleting the company');
    } finally {
      setIsPermanentlyDeleting(null);
    }
  };

  if (deletedCompanies.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Trash2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">No deleted companies found.</p>
          <p className="text-sm text-gray-500">The recycling bin is empty.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trash2 className="h-5 w-5" />
          Deleted Companies ({deletedCompanies.length})
        </CardTitle>
        <CardDescription>
          Manage deleted companies and recovery options. Companies can be recovered within 30 days.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {deletedCompanies.map((company) => {
            const recoverable = isRecoverable(company.deleted_at);
            const daysLeft = recoverable 
              ? Math.ceil((new Date(company.deleted_at).getTime() + (30 * 24 * 60 * 60 * 1000) - new Date().getTime()) / (24 * 60 * 60 * 1000))
              : 0;

            return (
              <div
                key={company.id}
                className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                  recoverable 
                    ? 'bg-green-50 border-green-200 hover:bg-green-100' 
                    : 'bg-red-50 border-red-200 hover:bg-red-100'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    recoverable ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    <Building className={`h-6 w-6 ${recoverable ? 'text-green-600' : 'text-red-600'}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-medium text-gray-900">{company.name}</h3>
                      <Badge variant={recoverable ? 'default' : 'destructive'}>
                        {recoverable ? 'Recoverable' : 'Expired'}
                      </Badge>
                      {recoverable && daysLeft > 0 && (
                        <Badge variant="outline" className="text-orange-600">
                          {daysLeft} days left
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{company.slug}</p>
                    {company.description && (
                      <p className="text-sm text-gray-500 mt-1">{company.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Created {format(new Date(company.created_at), 'MMM d, yyyy')}
                      </div>
                      <div className="flex items-center gap-1">
                        <Trash2 className="h-3 w-3" />
                        Deleted {formatDistanceToNow(new Date(company.deleted_at))} ago
                      </div>
                      {company.deleted_by_user && (
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          By {company.deleted_by_user.name}
                        </div>
                      )}
                    </div>
                    {company.deleted_reason && (
                      <div className="mt-2 p-2 bg-gray-100 rounded text-xs text-gray-600">
                        <strong>Reason:</strong> {company.deleted_reason}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {recoverable ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRecover(company.id)}
                      disabled={isRecovering === company.id}
                      className="text-green-600 hover:text-green-700 hover:bg-green-50"
                    >
                      {isRecovering === company.id ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 mr-2"></div>
                          Recovering...
                        </>
                      ) : (
                        <>
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Recover
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePermanentDelete(company.id)}
                      disabled={isPermanentlyDeleting === company.id}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      {isPermanentlyDeleting === company.id ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-2"></div>
                          Deleting...
                        </>
                      ) : (
                        <>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Permanently
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
} 