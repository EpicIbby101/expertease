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

    const { companyId } = await request.json();

    if (!companyId) {
      return NextResponse.json({ error: 'Company ID is required' }, { status: 400 });
    }

    // Check if company exists and is soft deleted
    const { data: company, error: fetchError } = await supabase
      .from('companies')
      .select('id, name, deleted_at')
      .eq('id', companyId)
      .not('deleted_at', 'is', null)
      .single();

    if (fetchError || !company) {
      return NextResponse.json({ error: 'Company not found or not deleted' }, { status: 404 });
    }

    // Check if company is outside recovery window (30 days)
    const deletedDate = new Date(company.deleted_at);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    if (deletedDate >= thirtyDaysAgo) {
      return NextResponse.json({ 
        error: `Company "${company.name}" cannot be permanently deleted yet. It has been deleted for less than 30 days and can still be recovered.` 
      }, { status: 400 });
    }

    // Permanently delete the company (hard delete from database)
    const { error: deleteError } = await supabase
      .from('companies')
      .delete()
      .eq('id', companyId);

    if (deleteError) {
      console.error('Error permanently deleting company:', deleteError);
      return NextResponse.json({ error: 'Failed to permanently delete company' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Company "${company.name}" has been permanently deleted from the database.`
    });

  } catch (error) {
    console.error('Error in permanent company deletion process:', error);
    return NextResponse.json({ error: 'Failed to permanently delete company' }, { status: 500 });
  }
} 