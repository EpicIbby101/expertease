import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is site admin
    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('user_id', userId)
      .single();

    if (!user || user.role !== 'site_admin') {
      return NextResponse.json({ error: 'Forbidden: Site admin access required' }, { status: 403 });
    }

    // Get all soft-deleted companies with deletion details
    const { data: deletedCompanies, error } = await supabase
      .from('companies')
      .select(`
        id,
        name,
        slug,
        description,
        max_trainees,
        is_active,
        created_at,
        deleted_at,
        deleted_by,
        deleted_reason
      `)
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false });

    if (error) {
      console.error('Error fetching deleted companies:', error);
      return NextResponse.json({ error: 'Failed to fetch deleted companies' }, { status: 500 });
    }

    // Get user details for deleted_by
    const deletedByUserIds = deletedCompanies
      ?.map(c => c.deleted_by)
      .filter(Boolean) || [];

    let deletedByUsers: any[] = [];
    if (deletedByUserIds.length > 0) {
      const { data: users } = await supabase
        .from('users')
        .select('user_id, first_name, last_name, email')
        .in('user_id', deletedByUserIds);
      deletedByUsers = users || [];
    }

    // Merge user details with companies
    const companiesWithUserDetails = deletedCompanies?.map(company => {
      const deletedByUser = deletedByUsers.find(u => u.user_id === company.deleted_by);
      return {
        ...company,
        deleted_by_user: deletedByUser ? {
          name: `${deletedByUser.first_name || ''} ${deletedByUser.last_name || ''}`.trim() || 'Unknown User',
          email: deletedByUser.email
        } : null
      };
    });

    return NextResponse.json({
      success: true,
      companies: companiesWithUserDetails || []
    });

  } catch (error) {
    console.error('Error in deleted companies fetch process:', error);
    return NextResponse.json({ error: 'Failed to fetch deleted companies' }, { status: 500 });
  }
} 