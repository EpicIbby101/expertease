import { createClient } from '@supabase/supabase-js';
import { hasRole, canManageUser } from '@/lib/auth';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function DELETE(request: Request) {
  // Check if the requester is a company admin
  const isCompanyAdmin = await hasRole('company_admin');
  if (!isCompanyAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { traineeId } = await request.json();

  if (!traineeId) {
    return NextResponse.json({ error: 'Missing trainee ID' }, { status: 400 });
  }

  // Check if user can manage the target trainee
  const canManage = await canManageUser(traineeId);
  if (!canManage) {
    return NextResponse.json({ error: 'Cannot manage this trainee' }, { status: 403 });
  }

  // Verify the trainee is actually a trainee
  const { data: trainee } = await supabase
    .from('users')
    .select('role')
    .eq('id', traineeId)
    .single();

  if (!trainee || trainee.role !== 'trainee') {
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
} 