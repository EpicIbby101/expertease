/**
 * Database Seed Script
 * 
 * Populates the database with sample data for development purposes.
 */

import { createDirectClient } from '@/lib/drizzle';
import { users } from '@/db/schema/users';
import { subscriptionsPlans } from '@/db/schema/subscriptions_plans';
import { createId } from '@paralleldrive/cuid2';
import * as dotenv from 'dotenv';

dotenv.config();

async function seed() {
  console.log('🌱 Seeding database with sample data...');
  
  if (!process.env.DIRECT_URL) {
    console.error('❌ DIRECT_URL environment variable is not set');
    process.exit(1);
  }
  
  try {
    const db = createDirectClient();
    
    // Insert sample users
    console.log('👤 Adding sample users...');
    const sampleUsers = [
      {
        email: 'john.doe@example.com',
        firstName: 'John',
        lastName: 'Doe',
        gender: 'male',
        userId: createId()
      },
      {
        email: 'jane.smith@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        gender: 'female',
        userId: createId()
      },
      {
        email: 'alex.chen@example.com',
        firstName: 'Alex',
        lastName: 'Chen',
        gender: 'non-binary',
        userId: createId()
      }
    ];
    
    await db.insert(users).values(sampleUsers);
    console.log(`✅ Added ${sampleUsers.length} sample users`);
    
    // Insert subscription plans
    console.log('💰 Adding subscription plans...');
    const samplePlans = [
      {
        name: 'Free',
        description: 'Basic plan with limited features',
        amount: '0',
        currency: 'usd',
        interval: 'month',
        planId: createId()
      },
      {
        name: 'Pro',
        description: 'Professional plan with all features',
        amount: '299',
        currency: 'usd',
        interval: 'month',
        planId: createId()
      },
      {
        name: 'Enterprise',
        description: 'Custom enterprise solution',
        amount: '999',
        currency: 'usd',
        interval: 'month',
        planId: createId()
      }
    ];
    
    await db.insert(subscriptionsPlans).values(samplePlans);
    console.log(`✅ Added ${samplePlans.length} subscription plans`);
    
    console.log('✅ Database seeded successfully');
  } catch (error) {
    console.error('❌ Failed to seed database');
    console.error(error);
    process.exit(1);
  }
}

seed();