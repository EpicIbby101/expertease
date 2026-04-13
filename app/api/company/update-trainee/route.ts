import { createClient } from '@supabase/supabase-js';
import { getAuthForApi } from '@/lib/auth';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function PUT(request: Request) {
  try {
    const { userId } = await getAuthForApi();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if the requester is a company admin
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, company_id')
      .eq('user_id', userId)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userRole = userData.role as 'site_admin' | 'company_admin' | 'trainee';
    const isCompanyAdmin = userRole === 'company_admin';
    
    if (!isCompanyAdmin) {
      return NextResponse.json({ error: 'Unauthorized - Company admin access required' }, { status: 403 });
    }

    const { traineeId, first_name, last_name, phone, job_title, department, date_of_birth, is_active } = await request.json();

    if (!traineeId) {
      return NextResponse.json({ error: 'Missing trainee ID' }, { status: 400 });
    }

    // Check if user can manage the target trainee (same company)
    const { data: targetUser } = await supabase
      .from('users')
      .select('company_id, role, user_id')
      .or(`id.eq.${traineeId},user_id.eq.${traineeId}`)
      .single();

    if (!targetUser || targetUser.company_id !== userData.company_id) {
      return NextResponse.json({ error: 'Cannot manage this trainee' }, { status: 403 });
    }

    // Verify the trainee is actually a trainee
    if (targetUser.role !== 'trainee') {
      return NextResponse.json({ error: 'User is not a trainee' }, { status: 400 });
    }

    // Update the trainee
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (first_name !== undefined) updateData.first_name = first_name.trim() || null;
    if (last_name !== undefined) updateData.last_name = last_name.trim() || null;
    if (phone !== undefined) updateData.phone = phone.trim() || null;
    if (job_title !== undefined) updateData.job_title = job_title.trim() || null;
    if (department !== undefined) updateData.department = department.trim() || null;
    if (date_of_birth !== undefined) updateData.date_of_birth = date_of_birth || null;
    if (is_active !== undefined) updateData.is_active = is_active;

    const { error } = await supabase
      .from('users')
      .update(updateData)
      .or(`id.eq.${traineeId},user_id.eq.${traineeId}`);

    if (error) {
      console.error('Error updating trainee:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Trainee updated successfully'
    });
  } catch (error) {
    console.error('Error in update-trainee API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

