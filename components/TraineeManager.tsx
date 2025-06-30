'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Users, Plus, Trash2, Mail, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface Trainee {
  id: string;
  email: string;
  role: 'trainee';
  created_at: string;
}

interface TraineeManagerProps {
  trainees: Trainee[];
  companyId?: string;
  companyName?: string;
}

export function TraineeManager({ trainees, companyId, companyName }: TraineeManagerProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const createTrainee = async () => {
    console.log('createTrainee called with:', { email, companyId });
    if (!email || !companyId) {
      console.log('Missing email or companyId:', { email, companyId });
      return;
    }
    
    setIsLoading(true);
    try {
      console.log('Sending request to create trainee...');
      const response = await fetch('/api/company/create-trainee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, companyId }),
      });

      console.log('Response status:', response.status);
      const responseData = await response.json();
      console.log('Response data:', responseData);

      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to create trainee');
      }

      // Reset form and close dialog
      setEmail('');
      setIsCreateDialogOpen(false);
      
      // Refresh the page to show new trainee
      window.location.reload();
    } catch (error) {
      console.error('Error creating trainee:', error);
      alert(error instanceof Error ? error.message : 'Failed to create trainee');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteTrainee = async (traineeId: string) => {
    if (!confirm('Are you sure you want to delete this trainee?')) return;
    
    setDeletingId(traineeId);
    try {
      const response = await fetch('/api/company/delete-trainee', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ traineeId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete trainee');
      }

      // Refresh the page to show updated list
      window.location.reload();
    } catch (error) {
      console.error('Error deleting trainee:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete trainee');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Create Trainee Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Trainees ({trainees.length})
              </CardTitle>
              <CardDescription>
                Add new trainees to {companyName || 'your company'}
              </CardDescription>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add Trainee
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Trainee</DialogTitle>
                  <DialogDescription>
                    Create a new trainee account. They will receive an email invitation to join.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="trainee@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
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
                    onClick={createTrainee}
                    disabled={!email || isLoading}
                  >
                    {isLoading ? 'Creating...' : 'Create Trainee'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {trainees.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No trainees yet. Add your first trainee to get started.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {trainees.map((trainee) => (
                <div
                  key={trainee.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Mail className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{trainee.email}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Calendar className="h-3 w-3" />
                        Joined {format(new Date(trainee.created_at), 'MMM d, yyyy')}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      View Progress
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteTrainee(trainee.id)}
                      disabled={deletingId === trainee.id}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      {deletingId === trainee.id ? (
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