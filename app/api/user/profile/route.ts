import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthForApi } from '@/lib/auth';
import { z } from 'zod';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Define the schema for profile updates
const userProfileUpdateSchema = z.object({
  first_name: z.string().min(1, { message: 'First name is required' }),
  last_name: z.string().min(1, { message: 'Last name is required' }),
  phone: z.string().optional(),
  job_title: z.string().optional(),
  department: z.string().optional(),
  bio: z.string().optional(),
  location: z.string().optional(),
  timezone: z.string().optional(),
  preferred_language: z.string().optional(),
});

export async function GET() {
  try {
    const { userId } = await getAuthForApi();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile with company information
    const { data: user, error } = await supabase
      .from('users')
      .select(`
        id,
        email,
        first_name,
        last_name,
        phone,
        job_title,
        department,
        bio,
        location,
        timezone,
        preferred_language,
        profile_completed,
        is_active,
        role,
        company_id,
        companies(name)
      `)
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Transform the data to include company name
    const profile = {
      ...user,
      company_name: user.companies?.[0]?.name || null,
      companies: undefined // Remove the nested object
    };

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Error in profile GET API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId } = await getAuthForApi();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate the input data
    const validatedData = userProfileUpdateSchema.parse(body);

    // Check if required fields are provided
    if (!validatedData.first_name || !validatedData.last_name) {
      return NextResponse.json({ 
        error: 'First name and last name are required' 
      }, { status: 400 });
    }

    // Calculate profile completion status
    const requiredFields = [
      validatedData.first_name,
      validatedData.last_name,
      validatedData.phone,
      validatedData.job_title,
      validatedData.department,
      validatedData.location,
      validatedData.timezone
    ];
    
    const completedFields = requiredFields.filter(field => field && field.trim() !== '').length;
    const profileCompleted = completedFields >= 5; // At least 5 out of 7 fields completed

    // Update user profile
    const { data: updatedUser, error } = await supabase
      .from('users')
      .update({
        first_name: validatedData.first_name,
        last_name: validatedData.last_name,
        phone: validatedData.phone || null,
        job_title: validatedData.job_title || null,
        department: validatedData.department || null,
        bio: validatedData.bio || null,
        location: validatedData.location || null,
        timezone: validatedData.timezone || null,
        preferred_language: validatedData.preferred_language || 'en',
        profile_completed: profileCompleted,
        last_active_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating user profile:', error);
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      user: updatedUser,
      profile_completed: profileCompleted
    });
  } catch (error) {
    console.error('Error in profile PUT API:', error);
    if (error instanceof Error && error.message.includes('validation')) {
      return NextResponse.json({ error: 'Invalid data provided' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 