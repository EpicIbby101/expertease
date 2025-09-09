import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createServerActionClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if current user is site admin
    const supabase = await createServerActionClient();
    const { data: userRole } = await supabase
      .from('users')
      .select('role')
      .eq('user_id', userId)
      .single();

    if (!userRole || userRole.role !== 'site_admin') {
      return NextResponse.json({ error: 'Forbidden: Site admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { userIds, isActive } = body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: 'User IDs array is required' }, { status: 400 });
    }

    if (typeof isActive !== 'boolean') {
      return NextResponse.json({ error: 'isActive must be a boolean' }, { status: 400 });
    }

    // Prevent site admins from deactivating themselves
    if (!isActive && userIds.includes(userId)) {
      return NextResponse.json({ error: 'Site admins cannot deactivate their own account' }, { status: 400 });
    }

    // Update all users
    const { error: updateError } = await supabase
      .from('users')
      .update({
        is_active: isActive,
        updated_at: new Date().toISOString()
      })
      .in('user_id', userIds);

    if (updateError) {
      console.error('Error updating user status:', updateError);
      return NextResponse.json({ error: 'Failed to update user status' }, { status: 500 });
    }

    const action = isActive ? 'activated' : 'deactivated';
    return NextResponse.json({ 
      message: `Successfully ${action} ${userIds.length} users`,
      updatedCount: userIds.length,
      isActive
    });

  } catch (error) {
    console.error('Error in bulk status toggle:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
