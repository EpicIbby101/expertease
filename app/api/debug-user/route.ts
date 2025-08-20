import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get the current user from Clerk (you'll need to pass this in the request)
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: 'No userId provided' }, { status: 400 });
    }

    console.log('Debugging user:', userId);

    // First, let's check what columns actually exist in the users table
    const { data: tableInfo, error: tableError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.error('Error checking table structure:', tableError);
      return NextResponse.json({ error: 'Failed to check table structure', details: tableError }, { status: 500 });
    }

    // Get the actual user record
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (userError) {
      console.error('Error fetching user:', userError);
      return NextResponse.json({ error: 'Failed to fetch user', details: userError }, { status: 500 });
    }

    // Let's also check if there are any users with company_name populated
    const { data: usersWithCompany, error: companyError } = await supabase
      .from('users')
      .select('user_id, email, company_id, company_name, role')
      .not('company_name', 'is', null)
      .limit(5);

    return NextResponse.json({
      message: 'Debug info retrieved',
      tableStructure: tableInfo.length > 0 ? Object.keys(tableInfo[0]) : 'No data to infer structure',
      user: user,
      usersWithCompany: usersWithCompany || [],
      companyError: companyError
    });

  } catch (error) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json({ error: 'Debug endpoint error', details: error }, { status: 500 });
  }
} 