import { createClient } from '@supabase/supabase-js';
import { hasRole } from '@/lib/auth';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function DELETE(request: Request) {
  // Check if the requester is a site admin
  const isSiteAdmin = await hasRole('site_admin');
  if (!isSiteAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { companyId } = await request.json();

  if (!companyId) {
    return NextResponse.json({ error: 'Missing company ID' }, { status: 400 });
  }

  // Check if company exists
  const { data: company } = await supabase
    .from('companies')
    .select('id, name')
    .eq('id', companyId)
    .single();

  if (!company) {
    return NextResponse.json({ error: 'Company not found' }, { status: 404 });
  }

  // Delete all users associated with this company first
  const { error: usersError } = await supabase
    .from('users')
    .delete()
    .eq('company_id', companyId);

  if (usersError) {
    console.error('Error deleting company users:', usersError);
    return NextResponse.json({ error: 'Failed to delete company users' }, { status: 500 });
  }

  // Delete the company
  const { error } = await supabase
    .from('companies')
    .delete()
    .eq('id', companyId);

  if (error) {
    console.error('Error deleting company:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ 
    success: true,
    message: `Company "${company.name}" and all associated users deleted successfully`
  });
} 