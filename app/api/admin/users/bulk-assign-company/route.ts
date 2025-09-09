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
    const { userIds, companyId } = body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: 'User IDs array is required' }, { status: 400 });
    }

    if (!companyId) {
      return NextResponse.json({ error: 'Company ID is required' }, { status: 400 });
    }

    // Verify company exists
    const { data: company } = await supabase
      .from('companies')
      .select('id, name, max_trainees')
      .eq('id', companyId)
      .is('deleted_at', null)
      .single();

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // Check if company has capacity for new trainees
    const { data: currentTrainees } = await supabase
      .from('users')
      .select('id')
      .eq('company_id', companyId)
      .eq('role', 'trainee')
      .eq('is_active', true);

    const currentTraineeCount = currentTrainees?.length || 0;
    const newTraineeCount = userIds.length;
    
    if (currentTraineeCount + newTraineeCount > company.max_trainees) {
      return NextResponse.json({ 
        error: `Company capacity exceeded. Current: ${currentTraineeCount}, Adding: ${newTraineeCount}, Max: ${company.max_trainees}` 
      }, { status: 400 });
    }

    // Update all users
    const { error: updateError } = await supabase
      .from('users')
      .update({
        company_id: companyId,
        updated_at: new Date().toISOString()
      })
      .in('user_id', userIds);

    if (updateError) {
      console.error('Error assigning company:', updateError);
      return NextResponse.json({ error: 'Failed to assign company' }, { status: 500 });
    }

    return NextResponse.json({ 
      message: `Successfully assigned ${userIds.length} users to ${company.name}`,
      updatedCount: userIds.length,
      companyName: company.name
    });

  } catch (error) {
    console.error('Error in bulk company assignment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
