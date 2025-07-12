import { getAuthForApi } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const { userId } = await getAuthForApi();
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

    // Get role directly from database
    const userRole = data.role as 'site_admin' | 'company_admin' | 'trainee';
    
    // Check role hierarchy
    const roleHierarchy = {
      trainee: 1,
      company_admin: 2,
      site_admin: 3
    };

    const hasSiteAdminAccess = roleHierarchy[userRole] >= roleHierarchy['site_admin'];
    const hasCompanyAdminAccess = roleHierarchy[userRole] >= roleHierarchy['company_admin'];
    const hasTraineeAccess = roleHierarchy[userRole] >= roleHierarchy['trainee'];
    
    return NextResponse.json({ 
      clerkUserId: userId,
      userRecord: data,
      dbError: error,
      role: userRole,
      hasSiteAdminAccess,
      hasCompanyAdminAccess,
      hasTraineeAccess,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in debug-role API:', error);
    return NextResponse.json({ error: 'Internal server error' });
  }
} 