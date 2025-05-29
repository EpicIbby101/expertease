'use server';

import { createDirectClient } from '@/lib/drizzle';
import { users } from '@/db/schema/users';
import { eq } from 'drizzle-orm';

/**
 * Get a user by ID using Drizzle ORM
 */
export async function getUserById(userId: string) {
  try {
    const db = createDirectClient();
    
    const result = await db.select()
      .from(users)
      .where(eq(users.userId, userId));
    
    return result[0] || null;
  } catch (error) {
    console.error('Error fetching user:', error);
    throw new Error('Failed to fetch user');
  }
}

/**
 * Update user profile with Drizzle ORM
 */
export async function updateUserProfile(
  userId: string, 
  data: { 
    firstName?: string; 
    lastName?: string; 
    bio?: string;
  }
) {
  try {
    const db = createDirectClient();
    
    // Map to the correct column names in the users schema
    const dbData = {
      firstName: data.firstName,
      lastName: data.lastName,
      // Note: bio field isn't in the schema yet, so we'll skip it
    };
    
    const result = await db.update(users)
      .set(dbData)
      .where(eq(users.userId, userId))
      .returning();
    
    return result[0];
  } catch (error) {
    console.error('Error updating user:', error);
    throw new Error('Failed to update user profile');
  }
} 