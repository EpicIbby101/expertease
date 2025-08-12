-- Add token column to invitations table for unique invitation links
-- This column stores a unique token for each invitation

-- Add token column if it doesn't exist
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS token TEXT;

-- Add unique constraint on token to ensure each invitation has a unique link
ALTER TABLE invitations ADD CONSTRAINT invitations_token_unique UNIQUE (token);

-- Add index for better performance on token lookups
CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);

-- Add comment for documentation
COMMENT ON COLUMN invitations.token IS 'Unique token for invitation link'; 