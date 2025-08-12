-- Add date_of_birth column to users table
-- This column stores the user's date of birth for age verification and compliance

-- Add date_of_birth column if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS date_of_birth DATE;

-- Add comment for documentation
COMMENT ON COLUMN users.date_of_birth IS 'User date of birth for age verification and compliance purposes';

-- Create index for better performance on date queries
CREATE INDEX IF NOT EXISTS idx_users_date_of_birth ON users(date_of_birth); 