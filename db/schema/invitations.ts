import { pgTable, text, timestamp, uuid, boolean, jsonb } from 'drizzle-orm/pg-core';
import { users } from './users';
import { companies } from './companies';

export const invitations = pgTable('invitations', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull(),
  role: text('role', { enum: ['site_admin', 'company_admin', 'trainee'] }).notNull(),
  company_id: uuid('company_id').references(() => companies.id),
  invited_by: uuid('invited_by').references(() => users.id).notNull(),
  status: text('status', { enum: ['pending', 'accepted', 'expired', 'cancelled'] }).default('pending'),
  token: text('token').unique().notNull(), // Unique invitation token
  expires_at: timestamp('expires_at').notNull(),
  accepted_at: timestamp('accepted_at'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
  // Store additional user information provided during invitation
  user_data: jsonb('user_data'), // Stores first_name, last_name, phone, job_title, department, location
});

export type Invitation = typeof invitations.$inferSelect;
export type NewInvitation = typeof invitations.$inferInsert; 