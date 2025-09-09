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

    const body = await request.json();
    const { userIds, role } = body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: 'User IDs array is required' }, { status: 400 });
    }

    if (!role || !['trainee', 'company_admin', 'site_admin'].includes(role)) {
      return NextResponse.json({ error: 'Valid role is required' }, { status: 400 });
    }

    // Prevent site admins from downgrading themselves
    if (userIds.includes(userId) && role !== 'site_admin') {
      return NextResponse.json({ error: 'Site admins cannot downgrade their own role' }, { status: 400 });
    }

    // Validate company assignment for trainee role
    if (role === 'trainee') {
      // Check if any users don't have a company assigned
      const { data: usersWithoutCompany } = await supabase
        .from('users')
        .select('id, email, company_id')
        .in('user_id', userIds)
        .or('company_id.is.null,company_id.eq.');

      if (usersWithoutCompany && usersWithoutCompany.length > 0) {
        return NextResponse.json({ 
          error: `Users without company assignment cannot be set to trainee role: ${usersWithoutCompany.map(u => u.email).join(', ')}` 
        }, { status: 400 });
      }
    }

    // Update all users
    const { error: updateError } = await supabase
      .from('users')
      .update({
        role,
        updated_at: new Date().toISOString()
      })
      .in('user_id', userIds);

    if (updateError) {
      console.error('Error updating user roles:', updateError);
      return NextResponse.json({ error: 'Failed to update user roles' }, { status: 500 });
    }

    return NextResponse.json({ 
      message: `Successfully updated ${userIds.length} users to ${role}`,
      updatedCount: userIds.length,
      role
    });

  } catch (error) {
    console.error('Error in bulk role update:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
