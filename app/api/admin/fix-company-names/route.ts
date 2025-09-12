import { NextRequest, NextResponse } from 'next/server';
import { createServerActionClient } from '@/lib/supabase';
import { auth } from '@clerk/nextjs/server';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is site admin
    const supabase = await createServerActionClient();
    const { data: userRole } = await supabase
      .from('users')
      .select('role')
      .eq('user_id', userId)
      .single();

    if (!userRole || userRole.role !== 'site_admin') {
      return NextResponse.json({ error: 'Forbidden: Site admin access required' }, { status: 403 });
    }

    console.log('🔍 Finding users with company_id but no company_name...');
    
    // Find users with company_id but no company_name
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, company_id, company_name')
      .not('company_id', 'is', null)
      .is('company_name', null);

    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    console.log(`📊 Found ${users.length} users that need company names`);

    const results = [];
    for (const user of users) {
      console.log(`🔧 Fixing user ${user.id} with company_id ${user.company_id}`);
      
      // Get company name
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .select('name')
        .eq('id', user.company_id)
        .single();

      if (companyError) {
        console.error(`❌ Error fetching company for user ${user.id}:`, companyError);
        results.push({ userId: user.id, status: 'error', message: 'Company not found' });
        continue;
      }

      if (!company) {
        console.warn(`⚠️ Company ${user.company_id} not found for user ${user.id}`);
        results.push({ userId: user.id, status: 'warning', message: 'Company not found' });
        continue;
      }

      // Update user with company name
      const { error: updateError } = await supabase
        .from('users')
        .update({ company_name: company.name })
        .eq('id', user.id);

      if (updateError) {
        console.error(`❌ Error updating user ${user.id}:`, updateError);
        results.push({ userId: user.id, status: 'error', message: updateError.message });
      } else {
        console.log(`✅ Updated user ${user.id} with company name: ${company.name}`);
        results.push({ userId: user.id, status: 'success', message: `Updated with company: ${company.name}` });
      }
    }

    console.log('🎉 Company name fix completed!');

    return NextResponse.json({ 
      success: true, 
      message: `Fixed ${results.length} users`,
      results 
    });

  } catch (error) {
    console.error('Error in fix company names:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
