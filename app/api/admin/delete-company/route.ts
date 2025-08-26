import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is site admin
    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('user_id', userId)  // Changed from 'id' to 'user_id'
      .single();

    if (!user || user.role !== 'site_admin') {
      return NextResponse.json({ error: 'Forbidden: Site admin access required' }, { status: 403 });
    }

    const { companyId, reason } = await request.json();

    if (!companyId) {
      return NextResponse.json({ error: 'Company ID is required' }, { status: 400 });
    }

    // Check if company exists and is not already deleted
    const { data: company, error: fetchError } = await supabase
      .from('companies')
      .select('id, name')
      .eq('id', companyId)
      .is('deleted_at', null)
      .single();

    if (fetchError || !company) {
      return NextResponse.json({ error: 'Company not found or already deleted' }, { status: 404 });
    }

    // Check if company has users (prevent deletion of companies with users)
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id')
      .eq('company_id', companyId);

    if (usersError) {
      console.error('Error checking company users:', usersError);
      return NextResponse.json({ error: 'Failed to check company users' }, { status: 500 });
    }

    if (users && users.length > 0) {
      return NextResponse.json({ 
        error: `Cannot delete company "${company.name}" because it has ${users.length} user(s). Please remove all users first.` 
      }, { status: 400 });
    }

    // Soft delete the company (mark as deleted instead of removing from database)
    const { error: softDeleteError } = await supabase
      .from('companies')
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: userId,
        deleted_reason: reason || 'Deleted by site admin',
        updated_at: new Date().toISOString()
      })
      .eq('id', companyId);

    if (softDeleteError) {
      console.error('Error soft deleting company:', softDeleteError);
      return NextResponse.json({ error: 'Failed to delete company' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Company "${company.name}" has been moved to the recycling bin. It can be recovered within 30 days.`
    });

  } catch (error) {
    console.error('Error in company deletion process:', error);
    return NextResponse.json({ error: 'Failed to delete company' }, { status: 500 });
  }
} 