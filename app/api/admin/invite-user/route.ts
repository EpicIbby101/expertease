import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthForApi } from '@/lib/auth';
import { randomBytes } from 'crypto';

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

    const { email, role, companyId } = await request.json();

    if (!email || !role) {
      return NextResponse.json({ error: 'Email and role are required' }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
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

    // Create invitation record
    const { data: invitation, error: invitationError } = await supabase
      .from('invitations')
      .insert({
        email,
        role,
        company_id: companyId || null,
        invited_by: userId,
        token,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (invitationError) {
      console.error('Error creating invitation:', invitationError);
      return NextResponse.json({ error: 'Failed to create invitation' }, { status: 500 });
    }

    // Send invitation email
    await sendInvitationEmail(email, token, role);

    return NextResponse.json({ 
      success: true, 
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        expires_at: invitation.expires_at
      }
    });

  } catch (error) {
    console.error('Error in invitation process:', error);
    return NextResponse.json({ error: 'Failed to send invitation' }, { status: 500 });
  }
}

async function sendInvitationEmail(email: string, token: string, role: string) {
  // For now, we'll use a simple approach
  // In production, you'd integrate with a proper email service like:
  // - Resend, SendGrid, AWS SES, etc.
  // - Or use Clerk's email templates if available

  const invitationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/accept-invitation?token=${token}`;
  
  // Log the invitation for now (replace with actual email sending)
  console.log('=== INVITATION EMAIL ===');
  console.log('To:', email);
  console.log('Subject: You\'ve been invited to join Expert Ease');
  console.log('Role:', role);
  console.log('Invitation URL:', invitationUrl);
  console.log('========================');

  // TODO: Replace with actual email sending
  // Example with a hypothetical email service:
  /*
  await emailService.send({
    to: email,
    subject: 'You\'ve been invited to join Expert Ease',
    template: 'invitation',
    data: {
      role,
      invitationUrl,
      expiresIn: '7 days'
    }
  });
  */
} 