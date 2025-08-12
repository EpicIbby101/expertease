import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthForApi } from '@/lib/auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { userId } = await getAuthForApi();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      email, 
      role, 
      company_id,
      first_name,
      last_name,
      phone,
      job_title,
      department,
      location,
      date_of_birth
    } = await request.json();

    if (!email || !role) {
      return NextResponse.json({ error: 'Email and role are required' }, { status: 400 });
    }

    // Check if user already exists in Supabase
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (existingUser) {
      // Update existing user with profile data
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({
          first_name: first_name || null,
          last_name: last_name || null,
          phone: phone || null,
          job_title: job_title || null,
          department: department || null,
          location: location || null,
          date_of_birth: date_of_birth || null,
          profile_completed: true,
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating user:', updateError);
        return NextResponse.json({ error: 'Failed to update user profile' }, { status: 500 });
      }

      // Mark invitation as accepted
      const { error: invitationError } = await supabase
        .from('invitations')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString(),
        })
        .eq('email', email)
        .eq('status', 'pending');

      if (invitationError) {
        console.error('Error updating invitation:', invitationError);
        // Don't fail the whole process if this fails
      }

      return NextResponse.json({ 
        success: true, 
        user: updatedUser,
        message: 'Profile updated successfully'
      });
    } else {
      // Create new user (this shouldn't happen with Clerk webhooks, but just in case)
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          user_id: userId,
          email: email,
          first_name: first_name || null,
          last_name: last_name || null,
          role: role,
          company_id: company_id || null,
          phone: phone || null,
          job_title: job_title || null,
          department: department || null,
          location: location || null,
          date_of_birth: date_of_birth || null,
          is_active: true,
          profile_completed: true,
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating user:', createError);
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
      }

      // Mark invitation as accepted
      const { error: invitationError } = await supabase
        .from('invitations')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString(),
        })
        .eq('email', email)
        .eq('status', 'pending');

      if (invitationError) {
        console.error('Error updating invitation:', invitationError);
        // Don't fail the whole process if this fails
      }

      return NextResponse.json({ 
        success: true, 
        user: newUser,
        message: 'User created successfully'
      });
    }

  } catch (error) {
    console.error('Error in accept invitation process:', error);
    return NextResponse.json({ error: 'Failed to accept invitation' }, { status: 500 });
  }
} 