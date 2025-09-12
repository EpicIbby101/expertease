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

    // Run the cleanup function
    const { data, error } = await supabase.rpc('cleanup_deleted_records');

    if (error) {
      console.error('Error running cleanup:', error);
      return NextResponse.json({ error: 'Failed to run cleanup' }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Cleanup completed successfully',
      data 
    });

  } catch (error) {
    console.error('Error in cleanup:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
