-- Create invitations table
-- This migration creates the invitations table with all necessary columns

CREATE TABLE IF NOT EXISTS invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('site_admin', 'company_admin', 'trainee')),
  company_id UUID REFERENCES companies(id),
  invited_by TEXT REFERENCES users(id) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  accepted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  user_data JSONB -- Stores additional user information provided during invitation
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON invitations(status);
CREATE INDEX IF NOT EXISTS idx_invitations_expires_at ON invitations(expires_at);

-- Add a comment to document the structure
COMMENT ON TABLE invitations IS 'Stores user invitations with token-based acceptance flow';
COMMENT ON COLUMN invitations.user_data IS 'Stores additional user information provided during invitation (first_name, last_name, phone, job_title, department, location)'; 