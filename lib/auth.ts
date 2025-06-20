// lib/auth.ts
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function getUserRole(): Promise<'site_admin' | 'company_admin' | 'trainee' | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const { data, error } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching user role:', error);
    return null;
  }

  return data.role as 'site_admin' | 'company_admin' | 'trainee';
}

export async function getUserCompany() {
  const { userId } = await auth();
  if (!userId) return null;

  const { data, error } = await supabase
    .from('users')
    .select('company_id, company_name')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching user company:', error);
    return null;
  }

  return data;
}

export async function hasRole(requiredRole: 'site_admin' | 'company_admin' | 'trainee') {
  const userRole = await getUserRole();
  if (!userRole) return false;

  const roleHierarchy = {
    trainee: 1,
    company_admin: 2,
    site_admin: 3
  };

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

export async function canManageUser(targetUserId: string) {
  const { userId } = await auth();
  if (!userId) return false;

  const userRole = await getUserRole();
  const userCompany = await getUserCompany();

  // Site admins can manage anyone
  if (userRole === 'site_admin') return true;

  // Company admins can only manage users in their company
  if (userRole === 'company_admin') {
    const { data: targetUser } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', targetUserId)
      .single();

    return targetUser?.company_id === userCompany?.company_id;
  }

  return false;
}