import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { headers } from 'next/headers';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const requiredRole = searchParams.get('role') as 'site_admin' | 'company_admin' | 'trainee';
  
  if (!requiredRole) {
    return NextResponse.json({ error: 'Role parameter required' }, { status: 400 });
  }

  try {
    // Properly await headers before calling auth
    await headers();
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ hasAccess: false });
    }

    // Get user role from database
    const { data, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    if (error || !data) {
      return NextResponse.json({ hasAccess: false });
    }

    const userRole = data.role as 'site_admin' | 'company_admin' | 'trainee';
    
    // Check role hierarchy
    const roleHierarchy = {
      trainee: 1,
      company_admin: 2,
      site_admin: 3
    };

    const hasAccess = roleHierarchy[userRole] >= roleHierarchy[requiredRole];
    return NextResponse.json({ hasAccess });
  } catch (error) {
    console.error('Error in check-role API:', error);
    return NextResponse.json({ hasAccess: false });
  }
} 