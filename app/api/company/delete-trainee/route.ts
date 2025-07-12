import { createClient } from '@supabase/supabase-js';
import { getAuthForApi } from '@/lib/auth';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function DELETE(request: Request) {
  try {
    const { userId } = await getAuthForApi();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if the requester is a company admin
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, company_id')
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userRole = userData.role as 'site_admin' | 'company_admin' | 'trainee';
    const isCompanyAdmin = userRole === 'company_admin';
    
    if (!isCompanyAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { traineeId } = await request.json();

    if (!traineeId) {
      return NextResponse.json({ error: 'Missing trainee ID' }, { status: 400 });
    }

    // Check if user can manage the target trainee (same company)
    const { data: targetUser } = await supabase
      .from('users')
      .select('company_id, role')
      .eq('id', traineeId)
      .single();

    if (!targetUser || targetUser.company_id !== userData.company_id) {
      return NextResponse.json({ error: 'Cannot manage this trainee' }, { status: 403 });
    }

    // Verify the trainee is actually a trainee
    if (targetUser.role !== 'trainee') {
      return NextResponse.json({ error: 'User is not a trainee' }, { status: 400 });
    }

    // Delete the trainee
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', traineeId);

    if (error) {
      console.error('Error deleting trainee:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Trainee deleted successfully'
    });
  } catch (error) {
    console.error('Error in delete-trainee API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 