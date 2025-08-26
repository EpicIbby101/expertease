-- Add missing fields to companies table
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS max_trainees INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Update existing companies to have default values
UPDATE companies 
SET 
  description = COALESCE(description, ''),
  max_trainees = COALESCE(max_trainees, 10),
  is_active = COALESCE(is_active, TRUE)
WHERE description IS NULL OR max_trainees IS NULL OR is_active IS NULL; 