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

    const { name, slug, description, max_trainees } = await request.json();

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: 'Company name is required' }, { status: 400 });
    }

    // Generate slug from company name if not provided
    const generatedSlug = slug || name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Check if company with this name or slug already exists
    const { data: existingCompany } = await supabase
      .from('companies')
      .select('id')
      .or(`name.eq.${name},slug.eq.${generatedSlug}`)
      .single();

    if (existingCompany) {
      return NextResponse.json({ 
        error: 'A company with this name or slug already exists' 
      }, { status: 400 });
    }

    // Create the company
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .insert({
        name: name.trim(),
        slug: generatedSlug,
        description: description?.trim() || null,
        max_trainees: max_trainees || 10,
        is_active: true,
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
        slug: company.slug,
        description: company.description,
        max_trainees: company.max_trainees,
        is_active: company.is_active,
        created_at: company.created_at
      }
    });

  } catch (error) {
    console.error('Error in company creation process:', error);
    return NextResponse.json({ error: 'Failed to create company' }, { status: 500 });
  }
} 