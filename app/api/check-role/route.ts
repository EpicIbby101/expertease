import { hasRole } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const requiredRole = searchParams.get('role') as 'site_admin' | 'company_admin' | 'trainee';
  
  if (!requiredRole) {
    return NextResponse.json({ error: 'Role parameter required' }, { status: 400 });
  }

  const hasAccess = await hasRole(requiredRole);
  return NextResponse.json({ hasAccess });
} 