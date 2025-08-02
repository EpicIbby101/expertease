import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get user from Supabase
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Get all users for comparison
    const { data: allUsers, error: allUsersError } = await supabase
      .from('users')
      .select('user_id, email, role')
      .order('created_at', { ascending: false })
      .limit(10);

    return NextResponse.json({
      clerkUserId: userId,
      userRecord: user,
      userError: userError,
      allUsers: allUsers || [],
      allUsersError: allUsersError,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 