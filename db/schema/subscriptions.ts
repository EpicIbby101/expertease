import { pgTable, serial, timestamp, varchar } from 'drizzle-orm/pg-core';

export const subscriptions = pgTable('subscriptions', {
  id: serial('id').primaryKey(),
  createdTime: timestamp('created_time').defaultNow(),
  subscriptionId: varchar('subscription_id').notNull(),
  stripeUserId: varchar('stripe_user_id').notNull(),
  status: varchar('status').notNull(),
  startDate: varchar('start_date').notNull(),
  endDate: varchar('end_date'),
  planId: varchar('plan_id').notNull(),
  defaultPaymentMethodId: varchar('default_payment_method_id'),
  email: varchar('email').notNull(),
  userId: varchar('user_id').notNull()
}); 