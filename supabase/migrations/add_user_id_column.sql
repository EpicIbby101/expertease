-- Add user_id column to users table for Clerk integration
-- This column stores the Clerk user ID for authentication

-- Add user_id column if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS user_id TEXT;

-- Add unique constraint on user_id to ensure one record per Clerk user
ALTER TABLE users ADD CONSTRAINT IF NOT EXISTS users_user_id_unique UNIQUE (user_id);

-- Add index for better performance on user_id lookups
CREATE INDEX IF NOT EXISTS idx_users_user_id ON users(user_id);

-- Add comment for documentation
COMMENT ON COLUMN users.user_id IS 'Clerk user ID for authentication'; 