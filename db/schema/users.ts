import { pgTable, serial, timestamp, varchar, text } from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';

export const users = pgTable('user', {
  id: serial('id').primaryKey(),
  createdTime: timestamp('created_time').defaultNow(),
  email: varchar('email').unique().notNull(),
  firstName: text('first_name'),
  lastName: text('last_name'),
  gender: text('gender'),
  profileImageUrl: text('profile_image_url'),
  userId: varchar('user_id').unique().notNull().$defaultFn(() => createId()),
  subscription: text('subscription')
}); 