import { AlertCircle, Mail, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function AccountDeactivatedPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-2xl text-gray-900">Account Deactivated</CardTitle>
          <CardDescription>
            Your account has been temporarily deactivated by an administrator.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-gray-600 space-y-2">
            <p>
              This may be due to:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Account suspension</li>
              <li>Security review</li>
              <li>Administrative action</li>
            </ul>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900">Need Help?</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Contact your administrator or support team to reactivate your account.
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={() => window.location.href = '/auth/sign-in'} 
              variant="outline" 
              className="flex-1"
            >
              Try Again
            </Button>
            <Button 
              onClick={() => window.location.href = 'mailto:support@example.com'} 
              className="flex-1"
            >
              Contact Support
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
