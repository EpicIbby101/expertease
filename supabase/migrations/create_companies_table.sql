-- Create companies table
CREATE TABLE IF NOT EXISTS companies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  max_trainees INTEGER DEFAULT 10,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add company_id to users table if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_users_company_id ON users(company_id);
CREATE INDEX IF NOT EXISTS idx_companies_slug ON companies(slug);

-- Add RLS policies for companies
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Site admins can see all companies
CREATE POLICY "Site admins can view all companies" ON companies
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid()::uuid
      AND users.role = 'site_admin'
    )
  );

-- Company admins can only see their own company
CREATE POLICY "Company admins can view own company" ON companies
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid()::uuid
      AND users.company_id = companies.id
      AND users.role = 'company_admin'
    )
  );

-- Site admins can insert companies
CREATE POLICY "Site admins can insert companies" ON companies
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid()::uuid
      AND users.role = 'site_admin'
    )
  );

-- Site admins can update companies
CREATE POLICY "Site admins can update companies" ON companies
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid()::uuid
      AND users.role = 'site_admin'
    )
  ); 