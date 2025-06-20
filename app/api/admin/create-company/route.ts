import { createClient } from '@supabase/supabase-js';
import { hasRole } from '@/lib/auth';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  // Check if the requester is a site admin
  const isSiteAdmin = await hasRole('site_admin');
  if (!isSiteAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { name, slug, description, max_trainees } = await request.json();

  if (!name || !slug) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Check if company with this slug already exists
  const { data: existingCompany } = await supabase
    .from('companies')
    .select('id')
    .eq('slug', slug)
    .single();

  if (existingCompany) {
    return NextResponse.json({ error: 'Company with this slug already exists' }, { status: 409 });
  }

  // Create company
  const { data: newCompany, error } = await supabase
    .from('companies')
    .insert({
      name,
      slug,
      description: description || null,
      max_trainees: max_trainees || 10,
      is_active: true
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating company:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ 
    success: true, 
    company: newCompany,
    message: 'Company created successfully.'
  });
} 