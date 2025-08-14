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

    console.log('Accepting invitation for user:', { userId, email, role, company_id });

    // Check if user already exists in Supabase
    const { data: existingUser, error: userCheckError } = await supabase
      .from('users')
      .select('id, user_id, email, role, company_id')
      .eq('user_id', userId)
      .single();

    if (userCheckError) {
      console.error('Error checking if user exists:', userCheckError);
    }

    console.log('Existing user check result:', { existingUser, userCheckError });

    if (existingUser) {
      console.log('Updating existing user:', existingUser.id);
      
      // Log current vs invitation data for debugging
      console.log('Current user data:', { 
        role: existingUser.role, 
        company_id: existingUser.company_id 
      });
      console.log('Invitation data:', { role, company_id });
      
      // Check for mismatches
      if (existingUser.role !== role) {
        console.warn(`Role mismatch: existing user has role '${existingUser.role}', invitation has '${role}'`);
      }
      if (existingUser.company_id !== company_id) {
        console.warn(`Company mismatch: existing user has company '${existingUser.company_id}', invitation has '${company_id}'`);
      }
      
      // Update existing user with profile data, but preserve role and company_id
      // The webhook should have already set these correctly
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
          // Don't update role or company_id - they should already be correct from webhook
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating user:', updateError);
        return NextResponse.json({ error: 'Failed to update user profile', details: updateError.message }, { status: 500 });
      }

      console.log('User updated successfully:', updatedUser);
      console.log('Final user data after update:', { 
        role: updatedUser.role, 
        company_id: updatedUser.company_id 
      });
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

    console.log('Final user data returned:', { 
      role: finalUser.role, 
      company_id: finalUser.company_id 
    });

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