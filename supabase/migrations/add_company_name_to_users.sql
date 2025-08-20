-- Add company_name field to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS company_name TEXT;

-- Add comment for documentation
COMMENT ON COLUMN users.company_name IS 'Company name for display purposes, denormalized from companies table';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_users_company_name ON users(company_name); 