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
      company_name, // Add company_name
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

    console.log('Accepting invitation for user:', { userId, email, role });

    // Check if user already exists in Supabase
    const { data: existingUser, error: userCheckError } = await supabase
      .from('users')
      .select('id, user_id, email, role, company_id')
      .eq('user_id', userId)
      .single();

    if (userCheckError) {
      console.error('Error checking if user exists:', userCheckError);
      // If user doesn't exist, we'll create them
    }

    console.log('Existing user check result:', { existingUser, userCheckError });

    if (existingUser) {
      console.log('Updating existing user:', existingUser.id);
      
      // Verify that the existing user has the correct role and company from the invitation
      if (existingUser.role !== role) {
        console.warn(`Role mismatch: existing user has role '${existingUser.role}', invitation has '${role}'`);
      }
      if (existingUser.company_id !== company_id) {
        console.warn(`Company mismatch: existing user has company '${existingUser.company_id}', invitation has '${company_id}'`);
      }
      
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
          company_name: company_name || null, // Update company name
          profile_completed: true,
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating user:', updateError);
        return NextResponse.json({ error: 'Failed to update user profile', details: updateError.message }, { status: 500 });
      }

      console.log('User updated successfully:', updatedUser);
    } else {
      console.log('Creating new user for invited user (fallback - should have been created by webhook)');
      
      // Create new user (this should happen for invited users)
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          user_id: userId,
          email: email,
          first_name: first_name || null,
          last_name: last_name || null,
          role: role,
          company_id: company_id || null,
          company_name: company_name || null, // Include company name
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
        return NextResponse.json({ error: 'Failed to create user', details: createError.message }, { status: 500 });
      }

      console.log('User created successfully:', newUser);
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
    } else {
      console.log('Invitation marked as accepted');
    }

    // Get the final user data to return
    const { data: finalUser, error: finalUserError } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (finalUserError) {
      console.error('Error fetching final user data:', finalUserError);
      return NextResponse.json({ 
        success: true, 
        message: 'Profile completed but could not fetch user data',
        warning: 'User data may not be immediately available'
      });
    }

    return NextResponse.json({ 
      success: true, 
      user: finalUser,
      message: 'Profile completed successfully'
    });

  } catch (error) {
    console.error('Error in accept invitation process:', error);
    return NextResponse.json({ error: 'Failed to accept invitation', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
} 