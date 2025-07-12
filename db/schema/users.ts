import { pgTable, serial, timestamp, varchar, text, uuid, boolean } from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';
import { companies } from './companies';

export const users = pgTable('user', {
  id: serial('id').primaryKey(),
  createdTime: timestamp('created_time').defaultNow(),
  email: varchar('email').unique().notNull(),
  firstName: text('first_name'),
  lastName: text('last_name'),
  gender: text('gender'),
  profileImageUrl: text('profile_image_url'),
  userId: varchar('user_id').unique().notNull().$defaultFn(() => createId()),
  subscription: text('subscription'),
  company_id: uuid('company_id').references(() => companies.id),
  
  // High priority fields
  role: text('role', { enum: ['site_admin', 'company_admin', 'trainee'] }).default('trainee'),
  phone: text('phone'),
  jobTitle: text('job_title'),
  department: text('department'),
  isActive: boolean('is_active').default(true),
  profileCompleted: boolean('profile_completed').default(false),
  
  // Additional useful fields
  bio: text('bio'),
  location: text('location'),
  timezone: text('timezone'),
  preferredLanguage: text('preferred_language').default('en'),
  lastActiveAt: timestamp('last_active_at'),
  emailVerified: boolean('email_verified').default(false),
}); 