-- Add soft delete support to users table
-- This adds the necessary columns for soft deletion tracking

-- Add soft delete columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_reason TEXT;

-- Add indexes for soft delete queries
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at);
CREATE INDEX IF NOT EXISTS idx_users_deleted_by ON users(deleted_by);

-- Update existing queries to filter out soft-deleted users
-- Note: This is handled in the application code by adding .is('deleted_at', null) to queries

