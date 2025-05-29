/**
 * Database Drop Script
 * 
 * This script drops all tables created by Drizzle from the database.
 * USE WITH CAUTION! This will remove all data.
 */

import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { sql } from 'drizzle-orm';
import * as dotenv from 'dotenv';

dotenv.config();

async function dropDatabase() {
  if (!process.env.DIRECT_URL) {
    console.error('❌ DIRECT_URL environment variable is not set');
    process.exit(1);
  }

  console.log('⚠️ WARNING: You are about to drop all tables from the database');
  console.log('This will remove ALL data permanently.');
  console.log('Press Ctrl+C now to cancel...');
  
  // Give user 5 seconds to cancel
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  console.log('🔄 Proceeding with database cleanup...');
  
  try {
    // Create a Postgres client
    const client = postgres(process.env.DIRECT_URL);
    const db = drizzle(client);
    
    // Drop all tables in public schema
    await db.execute(sql`
      DO $$ 
      DECLARE
        r RECORD;
      BEGIN
        FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
          EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE';
        END LOOP;
      END $$;
    `);
    
    console.log('✅ All tables dropped successfully');
    
    // Close the connection
    await client.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to drop tables');
    console.error(error);
    process.exit(1);
  }
}

dropDatabase(); 