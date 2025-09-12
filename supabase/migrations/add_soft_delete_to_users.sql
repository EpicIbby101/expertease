-- Add soft delete fields to users table (only if they don't exist)
DO $$ 
BEGIN
    -- Add deleted_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'deleted_at') THEN
        ALTER TABLE users ADD COLUMN deleted_at TIMESTAMP;
    END IF;
    
    -- Add deleted_by column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'deleted_by') THEN
        ALTER TABLE users ADD COLUMN deleted_by TEXT;
    END IF;
    
    -- Add deleted_reason column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'deleted_reason') THEN
        ALTER TABLE users ADD COLUMN deleted_reason TEXT;
    END IF;
END $$;

-- Add index for soft delete queries
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users(deleted_at);

-- Update RLS policies to exclude soft-deleted users
-- Only update policies for tables that exist
DO $$ 
BEGIN
    -- Update users policy to exclude soft-deleted users
    DROP POLICY IF EXISTS "Users can view their own data" ON "users";
    CREATE POLICY "Users can view their own data" 
      ON "users" 
      FOR SELECT 
      USING ((select auth.uid())::text = user_id AND deleted_at IS NULL);
    
    -- Only update other policies if the tables exist
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payments') THEN
        DROP POLICY IF EXISTS "Users can view their own payments" ON "payments";
        CREATE POLICY "Users can view their own payments" 
          ON "payments" 
          FOR SELECT 
          USING ((select auth.uid())::text = user_id);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subscriptions') THEN
        DROP POLICY IF EXISTS "Users can view their own subscriptions" ON "subscriptions";
        CREATE POLICY "Users can view their own subscriptions" 
          ON "subscriptions" 
          FOR SELECT 
          USING ((select auth.uid())::text = user_id);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'invoices') THEN
        DROP POLICY IF EXISTS "Users can view their own invoices" ON "invoices";
        CREATE POLICY "Users can view their own invoices" 
          ON "invoices" 
          FOR SELECT 
          USING ((select auth.uid())::text = user_id);
    END IF;
END $$;

-- Create cleanup function for automatic hard delete after 30 days
CREATE OR REPLACE FUNCTION cleanup_deleted_records()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_users_count INTEGER;
    deleted_companies_count INTEGER;
    result jsonb;
BEGIN
    -- Hard delete users that have been soft-deleted for more than 30 days
    DELETE FROM users 
    WHERE deleted_at IS NOT NULL 
    AND deleted_at < NOW() - INTERVAL '30 days';
    
    GET DIAGNOSTICS deleted_users_count = ROW_COUNT;
    
    -- Hard delete companies that have been soft-deleted for more than 30 days
    DELETE FROM companies 
    WHERE deleted_at IS NOT NULL 
    AND deleted_at < NOW() - INTERVAL '30 days';
    
    GET DIAGNOSTICS deleted_companies_count = ROW_COUNT;
    
    -- Build result
    result := jsonb_build_object(
        'deleted_users_count', deleted_users_count,
        'deleted_companies_count', deleted_companies_count,
        'cleanup_date', NOW()
    );
    
    RAISE NOTICE 'Cleanup completed: % users and % companies permanently deleted', 
        deleted_users_count, deleted_companies_count;
    
    RETURN result;
END;
$$;
