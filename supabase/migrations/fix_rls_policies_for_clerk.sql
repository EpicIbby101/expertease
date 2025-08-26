-- Fix RLS policies to work with Clerk authentication
-- The policies need to handle the type conversion between Clerk's text user ID and Supabase's auth.uid()

-- Drop existing policies
DROP POLICY IF EXISTS "Site admins can view all companies" ON companies;
DROP POLICY IF EXISTS "Company admins can view own company" ON companies;
DROP POLICY IF EXISTS "Site admins can insert companies" ON companies;
DROP POLICY IF EXISTS "Site admins can update companies" ON companies;

-- Recreate policies using the correct user_id field with proper type handling
-- Site admins can see all companies
CREATE POLICY "Site admins can view all companies" ON companies
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.user_id = auth.uid()::text
      AND users.role = 'site_admin'
    )
  );

-- Company admins can only see their own company
CREATE POLICY "Company admins can view own company" ON companies
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.user_id = auth.uid()::text
      AND users.company_id = companies.id
      AND users.role = 'company_admin'
    )
  );

-- Site admins can insert companies
CREATE POLICY "Site admins can insert companies" ON companies
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.user_id = auth.uid()::text
      AND users.role = 'site_admin'
    )
  );

-- Site admins can update companies
CREATE POLICY "Site admins can update companies" ON companies
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.user_id = auth.uid()::text
      AND users.role = 'site_admin'
    )
  );

-- Site admins can delete companies (for soft delete)
CREATE POLICY "Site admins can delete companies" ON companies
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.user_id = auth.uid()::text
      AND users.role = 'site_admin'
    )
  ); 