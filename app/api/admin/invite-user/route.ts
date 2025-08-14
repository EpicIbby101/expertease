import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthForApi } from '@/lib/auth';
import { clerkClient } from '@clerk/nextjs/server';

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

    // Check if user is a site admin using user_id
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('user_id', userId)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userRole = userData.role as 'site_admin' | 'company_admin' | 'trainee';
    const isSiteAdmin = userRole === 'site_admin';
    
    if (!isSiteAdmin) {
      return NextResponse.json({ error: 'Only site admins can invite users' }, { status: 403 });
    }

    const { 
      email, 
      first_name, 
      last_name, 
      role, 
      companyId,
      phone,
      job_title,
      department,
      location,
      date_of_birth
    } = await request.json();

    // Validate mandatory fields
    if (!email || !first_name || !last_name || !role || !date_of_birth) {
      return NextResponse.json({ error: 'Email, first name, last name, role, and date of birth are required' }, { status: 400 });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    // Name validation
    if (first_name.trim().length < 2) {
      return NextResponse.json({ error: 'First name must be at least 2 characters' }, { status: 400 });
    }

    if (last_name.trim().length < 2) {
      return NextResponse.json({ error: 'Last name must be at least 2 characters' }, { status: 400 });
    }

    // Check if user already exists in Supabase
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 400 });
    }

    // Check if invitation already exists and is pending
    const { data: existingInvitation } = await supabase
      .from('invitations')
      .select('id')
      .eq('email', email)
      .eq('status', 'pending')
      .single();

    if (existingInvitation) {
      return NextResponse.json({ error: 'An invitation has already been sent to this email' }, { status: 400 });
    }

    // Create a unique invitation token for the redirect URL
    const invitationToken = `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create Clerk invitation with metadata
    const invitationMetadata = {
      role,
      company_id: companyId || null,
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      phone: phone?.trim() || null,
      job_title: job_title?.trim() || null,
      department: department?.trim() || null,
      location: location?.trim() || null,
      date_of_birth: date_of_birth,
      invited_by: userId,
      invitation_token: invitationToken, // Include token in metadata for webhook lookup
    };

    console.log('Creating Clerk invitation with metadata:', invitationMetadata);

    // Create Clerk invitation using the proper invitation system
    // The redirect URL now includes the token so the webhook can link users to invitations
    const clerkInvitation = await clerkClient.invitations.createInvitation({
      emailAddress: email,
      redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/accept-invitation?token=${invitationToken}`,
      publicMetadata: invitationMetadata,
    });

    console.log('Clerk invitation created:', {
      id: clerkInvitation.id,
      email: clerkInvitation.emailAddress,
      status: clerkInvitation.status,
      publicMetadata: clerkInvitation.publicMetadata
    });

    // Store invitation record in Supabase for tracking
    const { data: invitation, error: invitationError } = await supabase
      .from('invitations')
      .insert({
        email,
        role,
        company_id: companyId || null,
        invited_by: userId,
        clerk_invitation_id: clerkInvitation.id,
        token: invitationToken, // Store the unique token
        status: 'pending',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        user_data: {
          first_name: first_name.trim(),
          last_name: last_name.trim(),
          phone: phone?.trim() || null,
          job_title: job_title?.trim() || null,
          department: department?.trim() || null,
          location: location?.trim() || null,
          date_of_birth: date_of_birth,
        }
      })
      .select()
      .single();

    if (invitationError) {
      console.error('Error creating invitation record:', invitationError);
      // Don't fail the whole process if Supabase record creation fails
      // Clerk invitation was already sent successfully
    }

    return NextResponse.json({ 
      success: true, 
      invitation: {
        id: invitation?.id,
        email: invitation?.email,
        role: invitation?.role,
        clerk_invitation_id: clerkInvitation.id,
        token: invitationToken,
        status: 'pending',
        expires_at: invitation?.expires_at,
        user_data: invitation?.user_data
      }
    });

  } catch (error) {
    console.error('Error in invitation process:', error);
    return NextResponse.json({ error: 'Failed to send invitation' }, { status: 500 });
  }
} 