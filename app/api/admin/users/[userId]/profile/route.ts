import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createServerActionClient } from '@/lib/supabase';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId: targetUserId } = await params;
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
    const {
      first_name,
      last_name,
      phone,
      job_title,
      department,
      location,
      date_of_birth,
      company_id,
      role,
      is_active
    } = body;

    // Validate required fields
    if (!first_name?.trim() || !last_name?.trim()) {
      return NextResponse.json({ error: 'First name and last name are required' }, { status: 400 });
    }

    // Check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', targetUserId)
      .single();

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prevent site admins from downgrading themselves
    if (targetUserId === userId && role !== 'site_admin') {
      return NextResponse.json({ error: 'Site admins cannot downgrade their own role' }, { status: 400 });
    }

    // Validate company assignment for trainee role
    if (role === 'trainee' && !company_id) {
      return NextResponse.json({ error: 'Trainees must be assigned to a company' }, { status: 400 });
    }

    // Update user profile
    const { error: updateError } = await supabase
      .from('users')
      .update({
        first_name: first_name.trim(),
        last_name: last_name.trim(),
        phone: phone?.trim() || null,
        job_title: job_title?.trim() || null,
        department: department?.trim() || null,
        location: location?.trim() || null,
        date_of_birth: date_of_birth || null,
        company_id: company_id || null,
        role,
        is_active,
        updated_at: new Date().toISOString(),
        profile_completed: true
      })
      .eq('user_id', targetUserId);

    if (updateError) {
      console.error('Error updating user profile:', updateError);
      return NextResponse.json({ error: 'Failed to update user profile' }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'User profile updated successfully',
      user: {
        id: targetUserId,
        first_name,
        last_name,
        phone,
        job_title,
        department,
        location,
        date_of_birth,
        company_id,
        role,
        is_active
      }
    });

  } catch (error) {
    console.error('Error in user profile update:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 