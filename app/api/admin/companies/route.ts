import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthForApi } from '@/lib/auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { userId } = await getAuthForApi();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is a site admin
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userRole = userData.role as 'site_admin' | 'company_admin' | 'trainee';
    const isSiteAdmin = userRole === 'site_admin';
    
    if (!isSiteAdmin) {
      return NextResponse.json({ error: 'Only site admins can create companies' }, { status: 403 });
    }

    const { name } = await request.json();

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: 'Company name is required' }, { status: 400 });
    }

    // Generate slug from company name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Check if company with this name or slug already exists
    const { data: existingCompany } = await supabase
      .from('companies')
      .select('id')
      .or(`name.eq.${name},slug.eq.${slug}`)
      .single();

    if (existingCompany) {
      return NextResponse.json({ error: 'A company with this name already exists' }, { status: 400 });
    }

    // Create the company
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .insert({
        name: name.trim(),
        slug,
      })
      .select()
      .single();

    if (companyError) {
      console.error('Error creating company:', companyError);
      return NextResponse.json({ error: 'Failed to create company' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      company: {
        id: company.id,
        name: company.name,
        slug: company.slug
      }
    });

  } catch (error) {
    console.error('Error in company creation process:', error);
    return NextResponse.json({ error: 'Failed to create company' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const { userId } = await getAuthForApi();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: companies, error } = await supabase
      .from('companies')
      .select('id, name, slug')
      .order('name');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ companies });
  } catch (error) {
    console.error('Error in companies GET API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 