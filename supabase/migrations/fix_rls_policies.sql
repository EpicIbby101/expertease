-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Site admins can view all companies" ON companies;
DROP POLICY IF EXISTS "Company admins can view own company" ON companies;
DROP POLICY IF EXISTS "Site admins can insert companies" ON companies;
DROP POLICY IF EXISTS "Site admins can update companies" ON companies;

-- Recreate policies with proper type casting
CREATE POLICY "Site admins can view all companies" ON companies
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id::text = auth.uid()
      AND users.role = 'site_admin'
    )
  );

CREATE POLICY "Company admins can view own company" ON companies
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id::text = auth.uid()
      AND users.company_id::text = companies.id::text
      AND users.role = 'company_admin'
    )
  );

CREATE POLICY "Site admins can insert companies" ON companies
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id::text = auth.uid()
      AND users.role = 'site_admin'
    )
  );

CREATE POLICY "Site admins can update companies" ON companies
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id::text = auth.uid()
      AND users.role = 'site_admin'
    )
  ); 