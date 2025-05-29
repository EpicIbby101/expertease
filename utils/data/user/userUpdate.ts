'server only';
import { userUpdateProps } from '@/utils/types';
import { createDirectClient } from '@/lib/drizzle';
import { users } from '@/db/schema/users';
import { eq } from 'drizzle-orm';

export const userUpdate = async ({
  email,
  first_name,
  last_name,
  profile_image_url,
  user_id,
}: userUpdateProps) => {
  try {
    const db = createDirectClient();
    
    const updated = await db.update(users)
      .set({
        email,
        firstName: first_name,
        lastName: last_name,
        profileImageUrl: profile_image_url,
        userId: user_id,
      })
      .where(eq(users.email, email))
      .returning();

    if (updated.length > 0) return updated[0];
    return { error: 'User not updated' };
  } catch (error: any) {
    console.error('Failed to update user:', error);
    return { error: error.message };
  }
};
