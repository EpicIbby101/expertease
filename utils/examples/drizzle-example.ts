'use server';

/**
 * This file demonstrates the complete implementation of Drizzle ORM
 * with Supabase in server actions.
 */

import { createDirectClient } from '@/lib/drizzle';
import { users } from '@/db/schema/users';
import { eq, like, desc, sql } from 'drizzle-orm';

/**
 * Example: Get user by ID
 */
export async function getUserById(userId: string) {
  try {
    const db = createDirectClient();
    
    const user = await db.select()
      .from(users)
      .where(eq(users.userId, userId));
    
    if (user.length === 0) {
      return { error: 'User not found' };
    }
    
    return { data: user[0] };
  } catch (error: any) {
    console.error('Error fetching user:', error);
    return { error: error.message };
  }
}

/**
 * Example: Create a new user
 */
export async function createUser(email: string, firstName?: string, lastName?: string) {
  try {
    const db = createDirectClient();
    
    const newUser = await db.insert(users)
      .values({
        email,
        firstName,
        lastName
      })
      .returning();
    
    return { data: newUser[0] };
  } catch (error: any) {
    console.error('Error creating user:', error);
    return { error: error.message };
  }
}

/**
 * Example: Update user information
 */
export async function updateUser(userId: string, data: Partial<Omit<typeof users.$inferInsert, 'id' | 'userId'>>) {
  try {
    const db = createDirectClient();
    
    const updatedUser = await db.update(users)
      .set(data)
      .where(eq(users.userId, userId))
      .returning();
    
    if (updatedUser.length === 0) {
      return { error: 'User not found' };
    }
    
    return { data: updatedUser[0] };
  } catch (error: any) {
    console.error('Error updating user:', error);
    return { error: error.message };
  }
}

/**
 * Example: Search users
 */
export async function searchUsers(searchTerm: string) {
  try {
    const db = createDirectClient();
    
    const results = await db.select()
      .from(users)
      .where(
        sql`${users.email} ILIKE ${'%' + searchTerm + '%'} OR 
            ${users.firstName} ILIKE ${'%' + searchTerm + '%'} OR 
            ${users.lastName} ILIKE ${'%' + searchTerm + '%'}`
      )
      .orderBy(desc(users.createdTime))
      .limit(10);
    
    return { data: results };
  } catch (error: any) {
    console.error('Error searching users:', error);
    return { error: error.message };
  }
}

/**
 * Example: Delete user
 */
export async function deleteUser(userId: string) {
  try {
    const db = createDirectClient();
    
    const deleted = await db.delete(users)
      .where(eq(users.userId, userId))
      .returning();
    
    if (deleted.length === 0) {
      return { error: 'User not found or already deleted' };
    }
    
    return { data: deleted[0] };
  } catch (error: any) {
    console.error('Error deleting user:', error);
    return { error: error.message };
  }
} 