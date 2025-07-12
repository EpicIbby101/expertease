import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Parse query params
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);
  const search = searchParams.get('search') || '';
  const role = searchParams.get('role') || '';
  const company = searchParams.get('company') || '';

  let query = supabase.from('users').select(`
    id, 
    email, 
    role, 
    company_name, 
    created_at,
    first_name,
    last_name,
    phone,
    job_title,
    department,
    is_active,
    profile_completed,
    last_active_at
  `, { count: 'exact' });

  // Filtering
  if (search) {
    query = query.ilike('email', `%${search}%`);
  }
  if (role) {
    query = query.eq('role', role);
  }
  if (company) {
    query = query.eq('company_name', company);
  }

  // Pagination
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data: users, count, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    users,
    total: count,
    page,
    pageSize,
    totalPages: count ? Math.ceil(count / pageSize) : 1,
  });
} 