import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUserRole } from '@/lib/auth';
import { AuditLogger } from '@/lib/audit';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(
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

    // Check if user is recoverable (within 30 days)
    const deletedAt = new Date(user.deleted_at);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    if (deletedAt <= thirtyDaysAgo) {
      return NextResponse.json({ 
        error: 'User cannot be recovered. Deletion is older than 30 days.' 
      }, { status: 400 });
    }

    // Recover the user
    const { error: recoverError } = await supabase
      .from('users')
      .update({
        deleted_at: null,
        deleted_by: null,
        deleted_reason: null
      })
      .eq('id', userId);

    if (recoverError) {
      console.error('Error recovering user:', recoverError);
      return NextResponse.json({ error: 'Failed to recover user' }, { status: 500 });
    }

    // Log the recovery action
    await AuditLogger.log({
      userId: 'current-user', // TODO: Get actual user ID
      action: 'user_recovered',
      resourceType: 'user',
      resourceId: userId,
      oldValues: { deleted_at: user.deleted_at, deleted_by: user.deleted_by },
      newValues: { deleted_at: null, deleted_by: null },
      metadata: { recovered_user_email: user.email },
      ...AuditLogger.extractClientInfo(request)
    });

    return NextResponse.json({ message: 'User recovered successfully' });

  } catch (error) {
    console.error('User recovery error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
