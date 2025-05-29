import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';
dotenv.config();

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
  // Migration settings
  migrations: {
    table: '__drizzle_migrations',
    schema: 'public'
  },
  verbose: false,
  strict: true
}); 