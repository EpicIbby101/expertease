/**
 * Apply RLS Policies to Database
 * 
 * This script applies Row Level Security policies defined in rls.sql to your database.
 * Run this after migrations when you need to set up or update RLS policies.
 */

import fs from 'fs';
import path from 'path';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as dotenv from 'dotenv';

dotenv.config();

async function applyRLS() {
  if (!process.env.DIRECT_URL) {
    console.error('❌ DIRECT_URL environment variable is not set');
    process.exit(1);
  }

  console.log('🔒 Applying RLS policies...');
  
  try {
    // Read the SQL file
    const sqlFilePath = path.join(__dirname, 'rls.sql');
    const sql = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Create a Postgres client
    const client = postgres(process.env.DIRECT_URL);
    const db = drizzle(client);
    
    // Execute the SQL
    console.log('Running RLS policy SQL...');
    await client.unsafe(sql);
    
    console.log('✅ RLS policies applied successfully');
    
    // Close the connection
    await client.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to apply RLS policies');
    console.error(error);
    process.exit(1);
  }
}

applyRLS(); 