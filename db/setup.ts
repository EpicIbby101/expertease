/**
 * Database Setup Script
 * 
 * This script applies migrations from the drizzle directory to set up the database.
 * Run this when setting up a new environment or after pulling new migrations.
 */

import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as dotenv from 'dotenv';

dotenv.config();

async function setup() {
  if (!process.env.DIRECT_URL) {
    console.error('❌ DIRECT_URL environment variable is not set');
    process.exit(1);
  }

  console.log('🔧 Setting up database...');
  
  try {
    // Create a Postgres client
    const client = postgres(process.env.DIRECT_URL);
    const db = drizzle(client);
    
    // Run migrations
    console.log('🔄 Applying migrations from ./drizzle directory...');
    await migrate(db, { migrationsFolder: './drizzle' });
    
    console.log('✅ Database setup completed successfully');
    
    // Close the connection
    await client.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Database setup failed');
    console.error(error);
    process.exit(1);
  }
}

setup(); 