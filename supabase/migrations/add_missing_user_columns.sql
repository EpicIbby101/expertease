-- Add missing user columns that are referenced in the code
-- This migration adds the columns that are causing the "column does not exist" error

-- Add role field if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'trainee' CHECK (role IN ('site_admin', 'company_admin', 'trainee'));

-- Add first_name and last_name if they don't exist (they might already exist)
ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name TEXT;

-- Add other missing columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS job_title TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMP WITH TIME ZONE;

-- Add company_name column if it doesn't exist (for backward compatibility)
ALTER TABLE users ADD COLUMN IF NOT EXISTS company_name TEXT;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_profile_completed ON users(profile_completed); 