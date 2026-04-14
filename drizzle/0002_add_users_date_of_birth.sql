ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "date_of_birth" date;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_users_date_of_birth" ON "users" ("date_of_birth");
