import { getUserRole, hasRole } from '@/lib/auth';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Not authenticated' });
  }

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message });
  }

  const role = await getUserRole();
  const hasSiteAdminAccess = await hasRole('site_admin');
  const hasCompanyAdminAccess = await hasRole('company_admin');
  const hasTraineeAccess = await hasRole('trainee');
  
  return NextResponse.json({ 
    clerkUserId: userId,
    userRecord: data,
    dbError: error,
    role,
    hasSiteAdminAccess,
    hasCompanyAdminAccess,
    hasTraineeAccess,
    timestamp: new Date().toISOString()
  });
} 