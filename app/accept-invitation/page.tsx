'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth, useClerk } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Mail, User, Building, Shield, Phone, Briefcase, MapPin, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface InvitationData {
  id: string;
  email: string;
  role: string;
  company_id?: string;
  company_name?: string;
  user_data?: {
    first_name?: string;
    last_name?: string;
    phone?: string;
    job_title?: string;
    department?: string;
    location?: string;
  };
  expires_at: string;
}

export default function AcceptInvitationPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const { openSignIn } = useClerk();
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setError('No invitation token provided');
      setIsLoading(false);
      return;
    }

    validateInvitation();
  }, [token]);

  const validateInvitation = async () => {
    try {
      const response = await fetch(`/api/invitations/validate?token=${token}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Invalid or expired invitation');
        setIsLoading(false);
        return;
      }

      setInvitation(data.invitation);
      setIsLoading(false);
    } catch (error) {
      console.error('Error validating invitation:', error);
      setError('Failed to validate invitation');
      setIsLoading(false);
    }
  };

  const handleAcceptInvitation = async () => {
    if (!invitation) return;

    setIsProcessing(true);
    try {
      // If user is not signed in, redirect to sign in with the invitation token
      if (!isSignedIn) {
        await openSignIn?.();
        return;
      }

      // Accept the invitation
      const response = await fetch('/api/invitations/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to accept invitation');
      }

      toast.success('Invitation accepted successfully! Welcome to Expert Ease!');
      
      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Error accepting invitation:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to accept invitation');
    } finally {
      setIsProcessing(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'site_admin':
        return <Shield className="h-5 w-5 text-purple-600" />;
      case 'company_admin':
        return <Building className="h-5 w-5 text-green-600" />;
      case 'trainee':
        return <User className="h-5 w-5 text-orange-600" />;
      default:
        return <User className="h-5 w-5 text-gray-600" />;
    }
  };

  const getRoleName = (role: string) => {
    switch (role) {
      case 'site_admin':
        return 'Site Administrator';
      case 'company_admin':
        return 'Company Administrator';
      case 'trainee':
        return 'Trainee';
      default:
        return role;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Validating invitation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-3">
              <AlertCircle className="h-6 w-6 text-red-600" />
              <CardTitle className="text-red-600">Invalid Invitation</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button 
              onClick={() => router.push('/')} 
              className="w-full mt-4"
            >
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invitation) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle className="text-2xl">You're Invited!</CardTitle>
            <CardDescription>
              Welcome to Expert Ease. Please review your invitation details below.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Invitation Details */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-3">Invitation Details</h3>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-blue-800">{invitation.email}</span>
                </div>
                
                <div className="flex items-center gap-3">
                  {getRoleIcon(invitation.role)}
                  <span className="text-sm text-blue-800">{getRoleName(invitation.role)}</span>
                </div>
                
                {invitation.company_name && (
                  <div className="flex items-center gap-3">
                    <Building className="h-4 w-4 text-blue-600" />
                    <span className="text-sm text-blue-800">{invitation.company_name}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Pre-filled User Information */}
            {invitation.user_data && (
              <>
                <Separator />
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Your Information</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    The following information was provided when you were invited:
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {invitation.user_data.first_name && (
                      <div>
                        <Label className="text-sm font-medium text-gray-700">First Name</Label>
                        <div className="mt-1 p-2 bg-gray-50 border rounded-md">
                          {invitation.user_data.first_name}
                        </div>
                      </div>
                    )}
                    
                    {invitation.user_data.last_name && (
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Last Name</Label>
                        <div className="mt-1 p-2 bg-gray-50 border rounded-md">
                          {invitation.user_data.last_name}
                        </div>
                      </div>
                    )}
                    
                    {invitation.user_data.phone && (
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Phone</Label>
                        <div className="mt-1 p-2 bg-gray-50 border rounded-md flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-400" />
                          {invitation.user_data.phone}
                        </div>
                      </div>
                    )}
                    
                    {invitation.user_data.job_title && (
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Job Title</Label>
                        <div className="mt-1 p-2 bg-gray-50 border rounded-md flex items-center gap-2">
                          <Briefcase className="h-4 w-4 text-gray-400" />
                          {invitation.user_data.job_title}
                        </div>
                      </div>
                    )}
                    
                    {invitation.user_data.department && (
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Department</Label>
                        <div className="mt-1 p-2 bg-gray-50 border rounded-md">
                          {invitation.user_data.department}
                        </div>
                      </div>
                    )}
                    
                    {invitation.user_data.location && (
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Location</Label>
                        <div className="mt-1 p-2 bg-gray-50 border rounded-md flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          {invitation.user_data.location}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Expiration Notice */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This invitation expires on {new Date(invitation.expires_at).toLocaleDateString()}. 
                Please accept it before then.
              </AlertDescription>
            </Alert>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => router.push('/')}
                className="flex-1"
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAcceptInvitation}
                className="flex-1"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Processing...
                  </>
                ) : isSignedIn ? (
                  'Accept Invitation'
                ) : (
                  'Sign In to Accept'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 