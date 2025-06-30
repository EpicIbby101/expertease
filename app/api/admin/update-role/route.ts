import { createClient } from '@supabase/supabase-js';
import { hasRole, canManageUser } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  // Check if the requester is a site admin
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const isSiteAdmin = await hasRole('site_admin');
  if (!isSiteAdmin) {
    return NextResponse.json({ error: 'Only site admins can update roles' }, { status: 403 });
  }

  const { userId: targetUserId, role } = await request.json();

  if (!targetUserId || !role) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Prevent site admins from downgrading themselves
  if (userId === targetUserId && role !== 'site_admin') {
    return NextResponse.json({ 
      error: 'Site admins cannot downgrade their own role' 
    }, { status: 403 });
  }

  // Check if user can manage the target user
  const canManage = await canManageUser(targetUserId);
  if (!canManage) {
    return NextResponse.json({ error: 'Cannot manage this user' }, { status: 403 });
  }

  const { error } = await supabase
    .from('users')
    .update({ role })
    .eq('id', targetUserId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
} 