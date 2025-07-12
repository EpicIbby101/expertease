-- Add user_data column to invitations table
-- This column stores additional user information provided during invitation

ALTER TABLE invitations ADD COLUMN IF NOT EXISTS user_data JSONB;

-- Add a comment to document the structure
COMMENT ON COLUMN invitations.user_data IS 'Stores additional user information provided during invitation (first_name, last_name, phone, job_title, department, location)'; 