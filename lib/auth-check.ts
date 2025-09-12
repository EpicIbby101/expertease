import { createServerActionClient } from '@/lib/supabase';
import { auth } from '@clerk/nextjs/server';

/**
 * Check if the current user is active (not deactivated)
 * This should be called in API routes and server components
 */
export async function checkUserActive(): Promise<{ isActive: boolean; error?: string }> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { isActive: false, error: 'Not authenticated' };
    }

    const supabase = await createServerActionClient();
    const { data: user, error } = await supabase
      .from('users')
      .select('is_active, email, first_name, last_name')
      .eq('user_id', userId)
      .single();

    if (error || !user) {
      return { isActive: false, error: 'User not found' };
    }

    if (!user.is_active) {
      return { 
        isActive: false, 
        error: 'Your account has been deactivated. Please contact an administrator.' 
      };
    }

    return { isActive: true };
  } catch (error) {
    console.error('Error checking user active status:', error);
    return { isActive: false, error: 'Authentication check failed' };
  }
}

/**
 * Middleware function to protect API routes from deactivated users
 */
export async function requireActiveUser() {
  const { isActive, error } = await checkUserActive();
  
  if (!isActive) {
    throw new Error(error || 'Account deactivated');
  }
  
  return true;
}
