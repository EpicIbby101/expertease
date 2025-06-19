import { getUserRole, hasRole } from '@/lib/auth';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET() {
  const { userId } = auth();
  
  let userRecord = null;
  let error = null;
  let allUsers = null;
  
  if (userId) {
    // Get the specific user
    const { data, error: dbError } = await supabase
      .from('users')
      .select('id, email, role')
      .eq('id', userId)
      .single();
    
    userRecord = data;
    error = dbError;
    
    // Also get all users to see what's in the table
    const { data: allUsersData } = await supabase
      .from('users')
      .select('id, email, role');
    
    allUsers = allUsersData;
  }
  
  const role = await getUserRole();
  const hasSiteAdminAccess = await hasRole('site_admin');
  const hasCompanyAdminAccess = await hasRole('company_admin');
  const hasTraineeAccess = await hasRole('trainee');
  
  return NextResponse.json({ 
    clerkUserId: userId,
    userRecord,
    dbError: error,
    allUsers,
    role,
    hasSiteAdminAccess,
    hasCompanyAdminAccess,
    hasTraineeAccess,
    timestamp: new Date().toISOString()
  });
} 