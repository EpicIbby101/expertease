import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUserRole } from '@/lib/auth';
import { AuditLogger } from '@/lib/audit';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // Check if user is site admin
    const role = await getUserRole();
    if (role !== 'site_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { userId } = params;

    // Check if user exists and is soft-deleted
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .not('deleted_at', 'is', null)
      .single();

    if (fetchError || !user) {
      return NextResponse.json({ error: 'User not found or not deleted' }, { status: 404 });
    }

    // Permanently delete the user
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (deleteError) {
      console.error('Error permanently deleting user:', deleteError);
      return NextResponse.json({ error: 'Failed to permanently delete user' }, { status: 500 });
    }

    // Log the permanent deletion action
    await AuditLogger.log({
      userId: 'current-user', // TODO: Get actual user ID
      action: 'user_permanently_deleted',
      resourceType: 'user',
      resourceId: userId,
      oldValues: { 
        email: user.email, 
        role: user.role, 
        deleted_at: user.deleted_at 
      },
      newValues: null,
      metadata: { 
        permanently_deleted_user_email: user.email,
        original_deletion_date: user.deleted_at 
      },
      ...AuditLogger.extractClientInfo(request)
    });

    return NextResponse.json({ message: 'User permanently deleted successfully' });

  } catch (error) {
    console.error('User permanent deletion error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
