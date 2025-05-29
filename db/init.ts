/**
 * Database Initialization Script
 * 
 * This is a one-stop script for setting up the database from scratch.
 * It:
 * 1. Generates migrations from the schema
 * 2. Applies those migrations to the database
 * 3. Adds sample data (optional)
 */

import { spawn } from 'child_process';
import * as dotenv from 'dotenv';
import * as readline from 'readline';

dotenv.config();

// Helper function to run commands
async function runCommand(command: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log(`\n> ${command} ${args.join(' ')}`);
    
    const process = spawn(command, args, { stdio: 'inherit' });
    
    process.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });
    
    process.on('error', (err) => {
      reject(err);
    });
  });
}

// Ask user for confirmation
async function confirm(question: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(`${question} (y/N): `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y');
    });
  });
}

async function init() {
  console.log('🚀 Database Initialization');
  console.log('=========================');
  
  try {
    // Check environment variables
    if (!process.env.DIRECT_URL) {
      throw new Error('DIRECT_URL environment variable is not set');
    }
    
    // Generate migrations
    console.log('\n📝 Step 1: Generating migrations from schema...');
    await runCommand('bun', ['run', 'db:generate']);
    
    // Apply migrations
    console.log('\n📥 Step 2: Applying migrations to database...');
    await runCommand('bun', ['run', 'db:migrate']);
    
    // Apply RLS policies
    console.log('\n🔒 Step 3: Applying RLS policies...');
    await runCommand('bun', ['run', 'db:rls']);
    
    // Optionally add sample data
    const addSampleData = await confirm('\n❓ Would you like to add sample data to the database?');
    if (addSampleData) {
      console.log('\n🌱 Step 4: Adding sample data...');
      await runCommand('bun', ['run', 'db:seed']);
    }
    
    console.log('\n✅ Database initialization completed successfully');
    console.log('\nYou can now:');
    console.log('- Run the application: bun run dev');
    console.log('- Explore the database: bun run db:studio');
    
  } catch (error) {
    console.error('\n❌ Database initialization failed');
    console.error(error);
    process.exit(1);
  }
}

init(); 