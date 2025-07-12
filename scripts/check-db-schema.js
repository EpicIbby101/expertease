// Script to check the current database schema
// Run this to see what columns exist in the users table

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkDatabaseSchema() {
  try {
    console.log('Checking database schema...\n');

    // Check if users table exists and get its structure
    const { data: tableInfo, error: tableError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'users')
      .order('ordinal_position');

    if (tableError) {
      console.error('Error checking table structure:', tableError);
      return;
    }

    console.log('Current users table columns:');
    console.log('============================');
    tableInfo.forEach(col => {
      console.log(`${col.column_name} (${col.data_type}) - ${col.is_nullable === 'YES' ? 'nullable' : 'not null'}`);
    });

    // Try to get a sample user to see what data exists
    console.log('\nTrying to fetch a sample user...');
    const { data: sampleUser, error: userError } = await supabase
      .from('users')
      .select('*')
      .limit(1)
      .single();

    if (userError) {
      console.error('Error fetching sample user:', userError);
    } else {
      console.log('\nSample user data:');
      console.log('==================');
      console.log(JSON.stringify(sampleUser, null, 2));
    }

  } catch (error) {
    console.error('Script failed:', error);
  }
}

checkDatabaseSchema(); 