import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';
dotenv.config();

// Use a direct Postgres URL or Supabase *session* pooler for CLI migrate.
// Transaction pooler (port 6543, "transaction" mode) often breaks DDL/migrations.
if (!process.env.DIRECT_URL) {
  throw new Error('DIRECT_URL is not defined in the environment variables');
}

export default defineConfig({
  schema: './db/schema',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DIRECT_URL,
  },
  // Migration settings (__drizzle_migrations in public — keep in sync with prod)
  migrations: {
    table: '__drizzle_migrations',
    schema: 'public',
  },
  verbose: false,
  strict: true
}); 