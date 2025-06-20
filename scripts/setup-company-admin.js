// Script to set up a company for existing company admins
// Run this after creating the companies table

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function setupCompanyAdmin() {
  try {
    // 1. Create a company
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .insert({
        name: 'Your Company',
        slug: 'your-company',
        description: 'Default company for existing admin',
        max_trainees: 50,
        is_active: true
      })
      .select()
      .single();

    if (companyError) {
      console.error('Error creating company:', companyError);
      return;
    }

    console.log('Created company:', company);

    // 2. Find company admin users without a company
    const { data: companyAdmins, error: usersError } = await supabase
      .from('users')
      .select('id, email')
      .eq('role', 'company_admin')
      .is('company_id', null);

    if (usersError) {
      console.error('Error fetching company admins:', usersError);
      return;
    }

    console.log('Found company admins without company:', companyAdmins);

    // 3. Assign company to company admins
    if (companyAdmins && companyAdmins.length > 0) {
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          company_id: company.id,
          company_name: company.name
        })
        .in('id', companyAdmins.map(admin => admin.id));

      if (updateError) {
        console.error('Error updating company admins:', updateError);
        return;
      }

      console.log('Successfully assigned company to', companyAdmins.length, 'company admins');
    }

    console.log('Setup complete!');
  } catch (error) {
    console.error('Setup failed:', error);
  }
}

// Run the setup
setupCompanyAdmin(); 