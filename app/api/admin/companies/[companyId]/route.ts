import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { AuditLogger } from '@/lib/audit-logger';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function PUT(
  request: NextRequest,
  { params }: { params: { companyId: string } }
) {
  try {
    const { companyId } = params;
    const body = await request.json();
    const { name, slug, description, max_trainees } = body;

    // Validate required fields
    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Company name and slug are required' },
        { status: 400 }
      );
    }

    // Validate slug format
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(slug)) {
      return NextResponse.json(
        { error: 'Company slug can only contain lowercase letters, numbers, and hyphens' },
        { status: 400 }
      );
    }

    // Validate slug length
    if (slug.length < 3) {
      return NextResponse.json(
        { error: 'Company slug must be at least 3 characters long' },
        { status: 400 }
      );
    }

    // Validate max trainees
    if (max_trainees < 1 || max_trainees > 1000) {
      return NextResponse.json(
        { error: 'Maximum trainees must be between 1 and 1000' },
        { status: 400 }
      );
    }

    // Check if company exists
    const { data: existingCompany, error: fetchError } = await supabase
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .is('deleted_at', null)
      .single();

    if (fetchError || !existingCompany) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    // Check if slug is already taken by another company
    const { data: slugConflict } = await supabase
      .from('companies')
      .select('id')
      .eq('slug', slug)
      .neq('id', companyId)
      .is('deleted_at', null)
      .single();

    if (slugConflict) {
      return NextResponse.json(
        { error: 'Company slug is already taken' },
        { status: 400 }
      );
    }

    // Update the company
    const { data: updatedCompany, error: updateError } = await supabase
      .from('companies')
      .update({
        name,
        slug,
        description: description || null,
        max_trainees,
        updated_at: new Date().toISOString()
      })
      .eq('id', companyId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating company:', updateError);
      return NextResponse.json(
        { error: 'Failed to update company' },
        { status: 500 }
      );
    }

    // Log the update
    await AuditLogger.log({
      action: 'company_updated',
      resourceType: 'company',
      resourceId: companyId,
      details: {
        company_name: updatedCompany.name,
        changes: {
          name: existingCompany.name !== name ? { from: existingCompany.name, to: name } : undefined,
          slug: existingCompany.slug !== slug ? { from: existingCompany.slug, to: slug } : undefined,
          description: existingCompany.description !== description ? { from: existingCompany.description, to: description } : undefined,
          max_trainees: existingCompany.max_trainees !== max_trainees ? { from: existingCompany.max_trainees, to: max_trainees } : undefined,
        }
      },
      userId: 'system', // TODO: Get actual user ID from auth
      userRole: 'site_admin'
    });

    return NextResponse.json({
      message: 'Company updated successfully',
      company: updatedCompany
    });

  } catch (error) {
    console.error('Error in company update API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
