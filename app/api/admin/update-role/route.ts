import { createClient } from '@supabase/supabase-js';
import { getAuthForApi } from '@/lib/auth';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    // Check if the requester is a site admin
    const { userId } = await getAuthForApi();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user role from database
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userRole = userData.role as 'site_admin' | 'company_admin' | 'trainee';
    const isSiteAdmin = userRole === 'site_admin';
    
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

    // Check if user can manage the target user (site admins can manage anyone)
    const canManage = isSiteAdmin; // Site admins can manage anyone
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
  } catch (error) {
    console.error('Error in update-role API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 