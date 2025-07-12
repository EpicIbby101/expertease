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

    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    // Get the invitation
    const { data: invitation, error: invitationError } = await supabase
      .from('invitations')
      .select('*')
      .eq('token', token)
      .eq('status', 'pending')
      .single();

    if (invitationError || !invitation) {
      return NextResponse.json({ error: 'Invalid or expired invitation' }, { status: 404 });
    }

    // Check if invitation has expired
    const now = new Date();
    const expiresAt = new Date(invitation.expires_at);
    
    if (now > expiresAt) {
      return NextResponse.json({ error: 'Invitation has expired' }, { status: 400 });
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }

    // Get user data from Clerk to ensure we have the email
    const { data: clerkUser, error: clerkError } = await supabase.auth.getUser();
    
    if (clerkError || !clerkUser.user) {
      return NextResponse.json({ error: 'Failed to get user information' }, { status: 500 });
    }

    const userEmail = clerkUser.user.email;
    
    // Verify email matches invitation
    if (userEmail !== invitation.email) {
      return NextResponse.json({ error: 'Email does not match invitation' }, { status: 400 });
    }

    // Create user record with invitation data
    const userData = invitation.user_data || {};
    
    const { data: newUser, error: userCreateError } = await supabase
      .from('users')
      .insert({
        user_id: userId,
        email: invitation.email,
        first_name: userData.first_name || null,
        last_name: userData.last_name || null,
        role: invitation.role,
        company_id: invitation.company_id,
        phone: userData.phone || null,
        job_title: userData.job_title || null,
        department: userData.department || null,
        location: userData.location || null,
        is_active: true,
        profile_completed: false, // User can complete their profile later
      })
      .select()
      .single();

    if (userCreateError) {
      console.error('Error creating user:', userCreateError);
      return NextResponse.json({ error: 'Failed to create user account' }, { status: 500 });
    }

    // Update invitation status to accepted
    const { error: updateError } = await supabase
      .from('invitations')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString(),
      })
      .eq('id', invitation.id);

    if (updateError) {
      console.error('Error updating invitation:', updateError);
      // Don't fail the whole process if this fails
    }

    return NextResponse.json({ 
      success: true, 
      user: newUser,
      message: 'Invitation accepted successfully'
    });

  } catch (error) {
    console.error('Error accepting invitation:', error);
    return NextResponse.json({ error: 'Failed to accept invitation' }, { status: 500 });
  }
} 