-- Add slug column to existing companies table
ALTER TABLE companies ADD COLUMN IF NOT EXISTS slug VARCHAR(255);

-- Add unique constraint to slug (drop first if exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'companies_slug_unique') THEN
        ALTER TABLE companies ADD CONSTRAINT companies_slug_unique UNIQUE (slug);
    END IF;
END $$;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_companies_slug ON companies(slug);

-- Update existing companies with a default slug if they don't have one
UPDATE companies 
SET slug = LOWER(REPLACE(name, ' ', '-'))
WHERE slug IS NULL; 