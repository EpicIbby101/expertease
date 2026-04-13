import { RoleGate } from '../../../components/RoleGate';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { HelpCircle, Mail, MessageSquare, AlertCircle, BookOpen, Settings, Bug, Rocket, CheckCircle, Send } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';
import Link from 'next/link';
import SupportTicketForm from '@/components/SupportTicketForm';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function SupportPage() {
  const { userId } = await auth();
  
  if (!userId) {
    return null;
  }

  // Get current user details
  const { data: currentUser } = await supabase
    .from('users')
    .select('first_name, last_name, email, company_name, company_id')
    .eq('user_id', userId)
    .single();

  // Get user's company admin email (if exists)
  let companyAdminEmail = null;
  if (currentUser?.company_id) {
    const { data: companyAdmin } = await supabase
      .from('users')
      .select('email, first_name, last_name')
      .eq('company_id', currentUser.company_id)
      .eq('role', 'company_admin')
      .limit(1)
      .single();
    
    companyAdminEmail = companyAdmin?.email || null;
  }

  return (
    <RoleGate requiredRole="trainee">
      <div className="space-y-6">
        {/* Fun Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 p-8 shadow-lg">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIzMCIvPjwvZz48L2c+PC9zdmc+')] opacity-20"></div>
          <div className="relative z-10">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg">
                <HelpCircle className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white mb-2 drop-shadow-lg">
                  Need Help? We're Here! 💬
                </h1>
                <p className="text-white/90 text-lg">
                  Contact support for assistance with courses, technical issues, or questions
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Support Options */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Contact Form Card */}
          <div className="lg:col-span-2">
            <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                    <Send className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl text-gray-800">Send a Message</CardTitle>
                    <CardDescription>Fill out the form below and we'll get back to you soon</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm text-gray-600">Submit a new support request</p>
                  <Link href="/trainee/support/tickets">
                    <Button variant="outline" size="sm">
                      View My Tickets
                    </Button>
                  </Link>
                </div>
                <SupportTicketForm 
                  userEmail={currentUser?.email || ''}
                  userName={currentUser?.first_name ? `${currentUser.first_name} ${currentUser.last_name || ''}`.trim() : currentUser?.email || 'User'}
                  companyName={currentUser?.company_name || ''}
                  companyAdminEmail={companyAdminEmail}
                />
              </CardContent>
            </Card>
          </div>

          {/* Help Resources */}
          <div className="space-y-6">
            {/* Quick Help */}
            <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                    <MessageSquare className="h-5 w-5 text-white" />
                  </div>
                  <CardTitle className="text-lg text-gray-800">Quick Help</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-purple-100">
                    <BookOpen className="h-5 w-5 text-purple-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">Course Questions?</p>
                      <p className="text-sm text-gray-600">Ask about course content, deadlines, or requirements</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-purple-100">
                    <Bug className="h-5 w-5 text-purple-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">Technical Issues?</p>
                      <p className="text-sm text-gray-600">Report bugs, login problems, or platform issues</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-purple-100">
                    <Settings className="h-5 w-5 text-purple-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">Account Help?</p>
                      <p className="text-sm text-gray-600">Get assistance with profile, access, or settings</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Info */}
            <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-white">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                    <Mail className="h-5 w-5 text-white" />
                  </div>
                  <CardTitle className="text-lg text-gray-800">Contact Info</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {companyAdminEmail && (
                  <div className="p-4 bg-white rounded-lg border border-green-100">
                    <p className="text-sm font-medium text-gray-700 mb-2">Your Company Admin</p>
                    <a 
                      href={`mailto:${companyAdminEmail}`}
                      className="text-green-600 hover:text-green-700 text-sm break-all"
                    >
                      {companyAdminEmail}
                    </a>
                  </div>
                )}
                <div className="p-4 bg-white rounded-lg border border-green-100">
                  <p className="text-sm font-medium text-gray-700 mb-2">Platform Support</p>
                  <a 
                    href="mailto:support@expertease.com"
                    className="text-green-600 hover:text-green-700 text-sm"
                  >
                    support@expertease.com
                  </a>
                </div>
              </CardContent>
            </Card>

            {/* Response Time */}
            <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-white">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                    <Rocket className="h-5 w-5 text-white" />
                  </div>
                  <CardTitle className="text-lg text-gray-800">Response Times</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Urgent issues: Within 4 hours</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>General inquiries: Within 24 hours</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Course questions: Within 48 hours</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </RoleGate>
  );
}
