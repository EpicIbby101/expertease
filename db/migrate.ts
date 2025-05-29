import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as dotenv from 'dotenv';

dotenv.config();

// This script applies migrations to the database
async function main() {
  if (!process.env.DIRECT_URL) {
    throw new Error('DIRECT_URL environment variable is not set');
  }

  console.log('🔃 Starting migration...');
  
  // Create a Postgres client
  const client = postgres(process.env.DIRECT_URL);
  const db = drizzle(client);
  
  // Run migrations from the drizzle directory
  console.log('🗂️ Applying migrations from ./drizzle directory...');
  await migrate(db, { migrationsFolder: './drizzle' });
  
  console.log('✅ Migrations completed successfully');
  
  // Close the connection
  await client.end();
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Migration failed');
  console.error(err);
  process.exit(1);
}); 