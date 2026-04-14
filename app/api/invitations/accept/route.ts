import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthForApi } from '@/lib/auth';
import { normalizeInviteEmail } from '@/lib/invitation-role';

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

    const emailNorm = normalizeInviteEmail(email);

    // Authoritative role / company from DB (client body can drift; webhook may have used wrong role once)
    const { data: inviteRows } = await supabase
      .from('invitations')
      .select('role, company_id, user_data')
      .ilike('email', emailNorm)
      .order('created_at', { ascending: false })
      .limit(1);

    const inviteRow = inviteRows?.[0];
    const authoritativeRole = inviteRow?.role ?? role;
    const authoritativeCompanyId = inviteRow?.company_id ?? company_id ?? null;
    const ud = inviteRow?.user_data as { company_name?: string } | null | undefined;
    const authoritativeCompanyName =
      company_name || ud?.company_name || null;

    console.log('Accepting invitation for user:', {
      userId,
      email: emailNorm,
      roleFromClient: role,
      authoritativeRole,
      authoritativeCompanyId,
    });

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

      if (existingUser.role !== authoritativeRole) {
        console.warn(
          `Correcting role: was '${existingUser.role}', invitation says '${authoritativeRole}'`,
        );
      }

      // Update existing user — always apply invitation role/company (fixes wrong webhook default)
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({
          email: emailNorm,
          role: authoritativeRole,
          company_id: authoritativeCompanyId,
          first_name: first_name || null,
          last_name: last_name || null,
          phone: phone || null,
          job_title: job_title || null,
          department: department || null,
          location: location || null,
          date_of_birth: date_of_birth || null,
          company_name: authoritativeCompanyName,
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
          email: emailNorm,
          first_name: first_name || null,
          last_name: last_name || null,
          role: authoritativeRole,
          company_id: authoritativeCompanyId,
          company_name: authoritativeCompanyName,
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
      .ilike('email', emailNorm)
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