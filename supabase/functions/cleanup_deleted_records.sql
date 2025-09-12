-- Function to automatically hard delete soft-deleted records after 30 days
CREATE OR REPLACE FUNCTION cleanup_deleted_records()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_users_count INTEGER;
    deleted_companies_count INTEGER;
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
    
    -- Log the cleanup operation
    INSERT INTO audit_logs (
        user_id,
        action,
        resource_type,
        resource_id,
        old_values,
        new_values,
        metadata,
        created_at
    ) VALUES (
        'system',
        'cleanup_automatic_hard_delete',
        'system',
        'cleanup',
        NULL,
        NULL,
        jsonb_build_object(
            'deleted_users_count', deleted_users_count,
            'deleted_companies_count', deleted_companies_count,
            'cleanup_date', NOW()
        ),
        NOW()
    );
    
    RAISE NOTICE 'Cleanup completed: % users and % companies permanently deleted', 
        deleted_users_count, deleted_companies_count;
END;
$$;

-- Create a scheduled job to run this function daily
-- Note: This requires pg_cron extension to be enabled in Supabase
-- You can also run this manually or set up a cron job externally

-- Example of how to schedule it (requires pg_cron):
-- SELECT cron.schedule('cleanup-deleted-records', '0 2 * * *', 'SELECT cleanup_deleted_records();');
