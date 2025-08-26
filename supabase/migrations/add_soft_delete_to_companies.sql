-- Add soft delete fields to companies table
ALTER TABLE companies
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS deleted_by TEXT REFERENCES users(user_id),
ADD COLUMN IF NOT EXISTS deleted_reason TEXT;

-- Create index for soft delete queries
CREATE INDEX IF NOT EXISTS idx_companies_deleted_at ON companies(deleted_at);

-- Update existing companies to have default values
UPDATE companies
SET
  deleted_at = NULL,
  deleted_by = NULL,
  deleted_reason = NULL
WHERE deleted_at IS NULL; 