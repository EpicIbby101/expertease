-- Add high priority user details fields to users table
-- This migration adds essential user profile fields

-- Add role field if it doesn't exist (it might already exist from previous migrations)
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'trainee' CHECK (role IN ('site_admin', 'company_admin', 'trainee'));

-- Add high priority user details
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS job_title TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT false;

-- Add additional useful fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS timezone TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'en';
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_profile_completed ON users(profile_completed);
CREATE INDEX IF NOT EXISTS idx_users_department ON users(department);
CREATE INDEX IF NOT EXISTS idx_users_job_title ON users(job_title);

-- Add comments for documentation
COMMENT ON COLUMN users.role IS 'User role: site_admin, company_admin, or trainee';
COMMENT ON COLUMN users.phone IS 'User phone number';
COMMENT ON COLUMN users.job_title IS 'User job title or position';
COMMENT ON COLUMN users.department IS 'User department within company';
COMMENT ON COLUMN users.is_active IS 'Whether the user account is active';
COMMENT ON COLUMN users.profile_completed IS 'Whether the user has completed their profile';
COMMENT ON COLUMN users.bio IS 'User biography or description';
COMMENT ON COLUMN users.location IS 'User location (city, country, etc.)';
COMMENT ON COLUMN users.timezone IS 'User timezone (e.g., America/New_York)';
COMMENT ON COLUMN users.preferred_language IS 'User preferred language code (e.g., en, es, fr)';
COMMENT ON COLUMN users.last_active_at IS 'Last time user was active on the platform';
COMMENT ON COLUMN users.email_verified IS 'Whether the user email has been verified'; 