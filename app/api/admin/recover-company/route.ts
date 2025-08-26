import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
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

    // Check if company is within recovery window (30 days)
    const deletedDate = new Date(company.deleted_at);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    if (deletedDate < thirtyDaysAgo) {
      return NextResponse.json({ 
        error: `Company "${company.name}" cannot be recovered. It has been deleted for more than 30 days.` 
      }, { status: 400 });
    }

    // Recover the company (remove soft delete markers)
    const { error: recoverError } = await supabase
      .from('companies')
      .update({
        deleted_at: null,
        deleted_by: null,
        deleted_reason: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', companyId);

    if (recoverError) {
      console.error('Error recovering company:', recoverError);
      return NextResponse.json({ error: 'Failed to recover company' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: `Company "${company.name}" has been successfully recovered.`
    });

  } catch (error) {
    console.error('Error in company recovery process:', error);
    return NextResponse.json({ error: 'Failed to recover company' }, { status: 500 });
  }
} 