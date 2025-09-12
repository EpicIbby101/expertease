import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createServerActionClient } from '@/lib/supabase';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId: targetUserId } = await params;
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
    const { is_active } = body;

    // Get current user's ID to prevent self-deactivation
    const { data: currentUser } = await supabase
      .from('users')
      .select('id')
      .eq('user_id', userId)
      .single();

    // Prevent site admins from deactivating themselves
    if (currentUser && parseInt(targetUserId) === currentUser.id && !is_active) {
      return NextResponse.json({ error: 'Site admins cannot deactivate their own account' }, { status: 400 });
    }

    // Check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('id', targetUserId)
      .single();

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update user status
    const { error: updateError } = await supabase
      .from('users')
      .update({
        is_active,
        updated_at: new Date().toISOString()
      })
      .eq('id', targetUserId);

    if (updateError) {
      console.error('Error updating user status:', updateError);
      return NextResponse.json({ error: 'Failed to update user status' }, { status: 500 });
    }

    return NextResponse.json({ 
      message: `User ${is_active ? 'activated' : 'deactivated'} successfully`,
      user: {
        id: targetUserId,
        is_active
      }
    });

  } catch (error) {
    console.error('Error in user status toggle:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 