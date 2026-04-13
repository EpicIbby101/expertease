-- Align `users` with app code (Supabase/PostgREST queries use `created_at`).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'users'
      AND column_name = 'created_time'
  )
  AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'users'
      AND column_name = 'created_at'
  ) THEN
    ALTER TABLE "users" RENAME COLUMN "created_time" TO "created_at";
  END IF;
END $$;
