import { createClient } from '@supabase/supabase-js';
import { hasRole, canManageUser } from '@/lib/auth';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  // Check if the requester is an admin
  const isAdmin = await hasRole('company_admin');
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { userId, role } = await request.json();

  if (!userId || !role) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Check if user can manage the target user
  const canManage = await canManageUser(userId);
  if (!canManage) {
    return NextResponse.json({ error: 'Cannot manage this user' }, { status: 403 });
  }

  const { error } = await supabase
    .from('users')
    .update({ role })
    .eq('id', userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
} 