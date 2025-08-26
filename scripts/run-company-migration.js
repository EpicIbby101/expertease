const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runCompanyMigration() {
  try {
    console.log('Starting company migration...');
    
    // Add new columns to companies table
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE companies 
        ADD COLUMN IF NOT EXISTS description TEXT,
        ADD COLUMN IF NOT EXISTS max_trainees INTEGER DEFAULT 10,
        ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
      `
    });

    if (alterError) {
      console.error('Error adding columns:', alterError);
      return;
    }

    console.log('✅ Added new columns to companies table');

    // Update existing companies with default values
    const { error: updateError } = await supabase.rpc('exec_sql', {
      sql: `
        UPDATE companies 
        SET 
          description = COALESCE(description, ''),
          max_trainees = COALESCE(max_trainees, 10),
          is_active = COALESCE(is_active, TRUE)
        WHERE description IS NULL OR max_trainees IS NULL OR is_active IS NULL;
      `
    });

    if (updateError) {
      console.error('Error updating existing companies:', updateError);
      return;
    }

    console.log('✅ Updated existing companies with default values');
    
    // Verify the migration
    const { data: companies, error: selectError } = await supabase
      .from('companies')
      .select('id, name, description, max_trainees, is_active')
      .limit(5);

    if (selectError) {
      console.error('Error verifying migration:', selectError);
      return;
    }

    console.log('✅ Migration completed successfully!');
    console.log('Sample companies after migration:', companies);
    
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

// Run the migration
runCompanyMigration(); 