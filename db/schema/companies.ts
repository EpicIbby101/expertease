import { pgTable, text, timestamp, uuid, integer, boolean } from 'drizzle-orm/pg-core';

export const companies = pgTable('companies', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').unique().notNull(),
  description: text('description'),
  max_trainees: integer('max_trainees').default(10),
  is_active: boolean('is_active').default(true),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
  // Soft delete fields
  deleted_at: timestamp('deleted_at'),
  deleted_by: text('deleted_by'), // References users.user_id (TEXT from Clerk)
  deleted_reason: text('deleted_reason'),
});

export type Company = typeof companies.$inferSelect;
export type NewCompany = typeof companies.$inferInsert; 