import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthForApi } from '@/lib/auth';
import { randomBytes } from 'crypto';
import Plunk from '@plunk/node';
import { render } from '@react-email/render';
import * as React from 'react';
import { InvitationEmail } from '@/lib/invitation-email';
import config from '@/config';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const plunk = new Plunk(process.env.PLUNK_SECRET_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const { userId } = await getAuthForApi();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is a site admin
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
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
      location
    } = await request.json();

    // Validate mandatory fields
    if (!email || !first_name || !last_name || !role) {
      return NextResponse.json({ error: 'Email, first name, last name, and role are required' }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    // Validate name fields
    if (first_name.trim().length < 2) {
      return NextResponse.json({ error: 'First name must be at least 2 characters' }, { status: 400 });
    }

    if (last_name.trim().length < 2) {
      return NextResponse.json({ error: 'Last name must be at least 2 characters' }, { status: 400 });
    }

    // Check if user already exists
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

    // Generate unique invitation token
    const token = randomBytes(32).toString('hex');
    
    // Set expiration (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Create invitation record with all the user information
    const { data: invitation, error: invitationError } = await supabase
      .from('invitations')
      .insert({
        email,
        role,
        company_id: companyId || null,
        invited_by: userId,
        token,
        expires_at: expiresAt.toISOString(),
        // Store additional user information in the invitation
        user_data: {
          first_name: first_name.trim(),
          last_name: last_name.trim(),
          phone: phone?.trim() || null,
          job_title: job_title?.trim() || null,
          department: department?.trim() || null,
          location: location?.trim() || null,
        }
      })
      .select()
      .single();

    if (invitationError) {
      console.error('Error creating invitation:', invitationError);
      return NextResponse.json({ error: 'Failed to create invitation' }, { status: 500 });
    }

    // Send invitation email with user information
    const emailResult = await sendInvitationEmail(email, token, role, {
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      phone: phone?.trim(),
      job_title: job_title?.trim(),
      department: department?.trim(),
      location: location?.trim(),
      company_id: companyId || null,
      invited_by: userId,
    });

    if (!emailResult.success) {
      console.error('Failed to send invitation email:', emailResult.error);
      return NextResponse.json({ error: 'Failed to send invitation email' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        expires_at: invitation.expires_at,
        user_data: invitation.user_data
      }
    });

  } catch (error) {
    console.error('Error in invitation process:', error);
    return NextResponse.json({ error: 'Failed to send invitation' }, { status: 500 });
  }
}

async function sendInvitationEmail(
  email: string, 
  token: string, 
  role: string, 
  userData: {
    first_name: string;
    last_name: string;
    phone?: string;
    job_title?: string;
    department?: string;
    location?: string;
    company_id?: string | null;
    invited_by: string;
  }
) {
  try {
    // Skip sending if email is disabled in config
    if (!config.email.enabled) {
      console.log('[EMAIL] Skipping invitation email - email service is disabled in config');
      return { success: false, error: 'Email service disabled' };
    }

    if (!process.env.PLUNK_SECRET_KEY) {
      console.error('[EMAIL] Missing PLUNK_SECRET_KEY environment variable');
      return { success: false, error: 'Missing API key' };
    }

    const invitationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/accept-invitation?token=${token}`;
    
    // Get company name if available
    let companyName = null;
    if (userData.company_id) {
      const { data: company } = await supabase
        .from('companies')
        .select('name')
        .eq('id', userData.company_id)
        .single();
      companyName = company?.name;
    }

    // Get inviter name
    let inviterName = null;
    try {
      const { data: inviter } = await supabase
        .from('users')
        .select('first_name, last_name')
        .eq('id', userData.invited_by)
        .single();
      if (inviter?.first_name && inviter?.last_name) {
        inviterName = `${inviter.first_name} ${inviter.last_name}`;
      }
    } catch (error) {
      console.log('[EMAIL] Could not fetch inviter name');
    }

    // Create email component
    const emailComponent = React.createElement(InvitationEmail, {
      invitationUrl,
      firstName: userData.first_name,
      lastName: userData.last_name,
      role,
      companyName: companyName || undefined,
      invitedBy: inviterName || undefined,
      expiresIn: '7 days'
    });

    const htmlBody = await render(emailComponent);

    console.log(`[EMAIL] Sending invitation email to ${email}`);
    
    const result = await plunk.emails.send({
      to: email,
      subject: `Welcome to Expert Ease, ${userData.first_name}!`,
      body: htmlBody,
    });

    console.log(`[EMAIL] Invitation email sent successfully to ${email}`);
    return { success: true, data: result };
  } catch (error) {
    console.error('[EMAIL] Failed to send invitation email:', error);
    return { success: false, error };
  }
} 