// lib/auth.ts
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function getUserRole(): Promise<'trainee' | 'instructor' | 'admin' | null> {
  const { userId } = auth();
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

  return data.role as 'trainee' | 'instructor' | 'admin';
}

export async function hasRole(requiredRole: 'trainee' | 'instructor' | 'admin') {
  const userRole = await getUserRole();
  if (!userRole) return false;

  const roleHierarchy = {
    trainee: 1,
    instructor: 2,
    admin: 3
  };

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}