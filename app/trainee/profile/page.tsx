import { currentUser } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { RoleGate } from '@/components/RoleGate';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { User, Building2, Info, LifeBuoy } from 'lucide-react';
import { format } from 'date-fns';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

function field(label: string, value: string | null | undefined) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-wide text-white">{label}</p>
      <p className="text-sm text-gray-500">{value?.trim() ? value : '—'}</p>
    </div>
  );
}

export default async function TraineeProfilePage() {
  const clerkUser = await currentUser();
  if (!clerkUser?.id) {
    return null;
  }

  const { data: user, error } = await supabase
    .from('users')
    .select(
      'email, first_name, last_name, phone, job_title, department, location, date_of_birth, company_name, role, is_active, profile_completed, created_at',
    )
    .eq('user_id', clerkUser.id)
    .maybeSingle();

  return (
    <RoleGate requiredRole="trainee">
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">My details</h1>
          <p className="mt-1 text-sm text-gray-600">
            Information your organization keeps on file. This page is read-only.
          </p>
        </div>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Need something updated?</AlertTitle>
          <AlertDescription className="mt-1 text-gray-700">
            Profile and employment fields are managed by your company administrator. Open a support
            ticket if you need help reaching them.
          </AlertDescription>
        </Alert>

        {error ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-red-600">
              Could not load your profile. Try again later.
            </CardContent>
          </Card>
        ) : !user ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-gray-600">
              No profile record found for your account.
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5 text-blue-600" />
                Profile on file
              </CardTitle>
              <CardDescription>Synced from your company&apos;s records</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={user.is_active ? 'default' : 'secondary'}>
                  {user.is_active ? 'Active' : 'Inactive'}
                </Badge>
                {user.profile_completed ? (
                  <Badge variant="outline" className="border-green-200 bg-green-50 text-green-800">
                    Profile complete
                  </Badge>
                ) : (
                  <Badge variant="outline">Profile incomplete</Badge>
                )}
              </div>

              <div className="grid gap-6 rounded-lg bg-gray-900 p-6 sm:grid-cols-2">
                {field('Email', user.email)}
                {field('First name', user.first_name)}
                {field('Last name', user.last_name)}
                {field('Phone', user.phone)}
                {field('Job title', user.job_title)}
                {field('Department', user.department)}
                {field('Location', user.location)}
                {field(
                  'Date of birth',
                  user.date_of_birth
                    ? format(typeof user.date_of_birth === 'string' ? new Date(user.date_of_birth) : new Date(), 'PP')
                    : null,
                )}
              </div>

              <div className="flex items-start gap-2 rounded-lg border bg-gray-50/80 p-4">
                <Building2 className="mt-0.5 h-5 w-5 shrink-0 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Organization</p>
                  <p className="text-sm text-gray-600">{user.company_name || '—'}</p>
                </div>
              </div>

              {user.created_at ? (
                <p className="text-xs text-gray-400">
                  Member since{' '}
                  {format(new Date(user.created_at as string), 'MMMM d, yyyy')}
                </p>
              ) : null}
            </CardContent>
          </Card>
        )}

        <div className="flex flex-wrap gap-3">
          <Link
            href="/trainee/support"
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-blue-700"
          >
            <LifeBuoy className="h-4 w-4" />
            Contact support
          </Link>
          <Link
            href="/trainee/dashboard"
            className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    </RoleGate>
  );
}
