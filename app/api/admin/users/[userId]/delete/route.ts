import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createServerActionClient } from '@/lib/supabase';
import { AuditLogger } from '@/lib/audit';

export async function DELETE(
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

    // Get current user's ID to prevent self-deletion
    const { data: currentUser } = await supabase
      .from('users')
      .select('id')
      .eq('user_id', userId)
      .single();

    // Prevent site admins from deleting themselves
    if (currentUser && parseInt(targetUserId) === currentUser.id) {
      return NextResponse.json({ error: 'Site admins cannot delete their own account' }, { status: 400 });
    }

    // Check if user exists and is not already deleted
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('id', targetUserId)
      .is('deleted_at', null)
      .single();

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found or already deleted' }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const { reason } = body;

    // Soft delete the user
    const { error: deleteError } = await supabase
      .from('users')
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: userId,
        deleted_reason: reason || 'Deleted by admin',
        updated_at: new Date().toISOString()
      })
      .eq('id', targetUserId);

    if (deleteError) {
      console.error('Error soft deleting user:', deleteError);
      return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
    }

    // Log the deletion action
    await AuditLogger.log({
      userId: userId,
      action: 'user_deleted',
      resourceType: 'user',
      resourceId: targetUserId,
      oldValues: { 
        email: existingUser.email, 
        role: existingUser.role,
        is_active: existingUser.is_active
      },
      newValues: { 
        deleted_at: new Date().toISOString(),
        deleted_by: userId,
        deleted_reason: reason || 'Deleted by admin'
      },
      metadata: { 
        deleted_user_email: existingUser.email,
        deletion_reason: reason || 'Deleted by admin'
      },
      ...AuditLogger.extractClientInfo(request)
    });

    return NextResponse.json({ 
      message: 'User deleted successfully',
      user: {
        id: targetUserId,
        email: existingUser.email,
        deleted_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error in user deletion:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
