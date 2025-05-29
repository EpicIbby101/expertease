import { pgTable, serial, timestamp, varchar, text } from 'drizzle-orm/pg-core';

export const subscriptionsPlans = pgTable('subscriptions_plans', {
  id: serial('id').primaryKey(),
  createdTime: timestamp('created_time').defaultNow(),
  planId: varchar('plan_id').notNull(),
  name: varchar('name').notNull(),
  description: text('description').notNull(),
  amount: varchar('amount').notNull(),
  currency: varchar('currency').notNull(),
  interval: varchar('interval').notNull()
}); 