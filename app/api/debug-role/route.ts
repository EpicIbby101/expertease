import { getUserRole, hasRole } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET() {
  const role = await getUserRole();
  const hasSiteAdminAccess = await hasRole('site_admin');
  const hasCompanyAdminAccess = await hasRole('company_admin');
  const hasTraineeAccess = await hasRole('trainee');
  
  return NextResponse.json({ 
    role,
    hasSiteAdminAccess,
    hasCompanyAdminAccess,
    hasTraineeAccess,
    timestamp: new Date().toISOString()
  });
} 