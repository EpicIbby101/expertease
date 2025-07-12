import { z } from 'zod';

export type userCreateProps = z.infer<typeof userCreateSchema>;

const userCreateSchema = z.object({
  email: z.string().email({ message: 'Invalid email' }).describe('user email'),
  first_name: z
    .string()
    .regex(/^[a-zA-Z]+$/, { message: 'First name must only contain letters' })
    .min(3, { message: 'First name is required' })
    .describe('user first name'),
  last_name: z
    .string()
    .regex(/^[a-zA-Z]+$/, { message: 'Last name must only contain letters' })
    .min(3, { message: 'Last name is required' })
    .describe('user last name'),
  profile_image_url: z
    .string()
    .url({ message: 'Invalid URL' })
    .optional()
    .describe('user profile image URL'),
  user_id: z.string().describe('user ID'),
  // High priority fields
  role: z.enum(['site_admin', 'company_admin', 'trainee']).default('trainee').describe('user role'),
  phone: z.string().optional().describe('user phone number'),
  job_title: z.string().optional().describe('user job title'),
  department: z.string().optional().describe('user department'),
  is_active: z.boolean().default(true).describe('whether user account is active'),
  profile_completed: z.boolean().default(false).describe('whether user profile is completed'),
  // Additional fields
  bio: z.string().optional().describe('user biography'),
  location: z.string().optional().describe('user location'),
  timezone: z.string().optional().describe('user timezone'),
  preferred_language: z.string().default('en').describe('user preferred language'),
});

export type userUpdateProps = z.infer<typeof userUpdateSchema>;

const userUpdateSchema = z.object({
  email: z
    .string()
    .email({ message: 'Invalid email' })
    .nonempty({ message: 'Email is required' })
    .describe('user email'),
  first_name: z
    .string()
    .regex(/^[a-zA-Z]+$/, { message: 'First name must only contain letters' })
    .describe('user first name'),
  last_name: z
    .string()
    .regex(/^[a-zA-Z]+$/, { message: 'Last name must only contain letters' })
    .describe('user last name'),
  profile_image_url: z
    .string()
    .url({ message: 'Invalid URL' })
    .optional()
    .describe('user profile image URL'),
  user_id: z.string().describe('user ID'),
  // High priority fields
  role: z.enum(['site_admin', 'company_admin', 'trainee']).optional().describe('user role'),
  phone: z.string().optional().describe('user phone number'),
  job_title: z.string().optional().describe('user job title'),
  department: z.string().optional().describe('user department'),
  is_active: z.boolean().optional().describe('whether user account is active'),
  profile_completed: z.boolean().optional().describe('whether user profile is completed'),
  // Additional fields
  bio: z.string().optional().describe('user biography'),
  location: z.string().optional().describe('user location'),
  timezone: z.string().optional().describe('user timezone'),
  preferred_language: z.string().optional().describe('user preferred language'),
});

// New schema for profile updates
export type userProfileUpdateProps = z.infer<typeof userProfileUpdateSchema>;

const userProfileUpdateSchema = z.object({
  first_name: z.string().min(1, { message: 'First name is required' }).describe('user first name'),
  last_name: z.string().min(1, { message: 'Last name is required' }).describe('user last name'),
  phone: z.string().optional().describe('user phone number'),
  job_title: z.string().optional().describe('user job title'),
  department: z.string().optional().describe('user department'),
  bio: z.string().optional().describe('user biography'),
  location: z.string().optional().describe('user location'),
  timezone: z.string().optional().describe('user timezone'),
  preferred_language: z.string().optional().describe('user preferred language'),
});
