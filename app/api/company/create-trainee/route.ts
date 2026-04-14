import { createClient } from '@supabase/supabase-js';
import { isClerkAPIResponseError } from '@clerk/shared/error';
import { clerkClient } from '@clerk/nextjs/server';
import { getAuthForApi } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { normalizeInviteEmail } from '@/lib/invitation-role';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

/** Company admins invite trainees via Clerk + `invitations` (same pattern as site admin). */
export async function POST(request: Request) {
  try {
    const { userId } = await getAuthForApi();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, company_id, company_name')
      .eq('user_id', userId)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userRole = userData.role as 'site_admin' | 'company_admin' | 'trainee';
    if (userRole !== 'company_admin') {
      return NextResponse.json({ error: 'Only company admins can invite trainees' }, { status: 403 });
    }

    const body = await request.json();
    const {
      email,
      first_name,
      last_name,
      companyId,
      message,
      phone,
      job_title,
      department,
      location,
      date_of_birth,
    } = body as {
      email?: string;
      first_name?: string;
      last_name?: string;
      companyId?: string;
      message?: string;
      phone?: string;
      job_title?: string;
      department?: string;
      location?: string;
      date_of_birth?: string;
    };

    if (!email || !first_name || !last_name || !companyId) {
      return NextResponse.json(
        { error: 'Email, first name, last name, and company are required' },
        { status: 400 },
      );
    }

    if (userData.company_id !== companyId) {
      return NextResponse.json(
        { error: 'You can only invite trainees to your own company' },
        { status: 403 },
      );
    }

    const emailNormalized = normalizeInviteEmail(email);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailNormalized)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    if (first_name.trim().length < 2 || last_name.trim().length < 2) {
      return NextResponse.json(
        { error: 'First and last name must be at least 2 characters' },
        { status: 400 },
      );
    }

    const { data: companyData, error: companyError } = await supabase
      .from('companies')
      .select('id, name, deleted_at')
      .eq('id', companyId)
      .single();

    if (companyError || !companyData) {
      return NextResponse.json({ error: 'Company not found' }, { status: 400 });
    }

    if (companyData.deleted_at) {
      return NextResponse.json({ error: 'Cannot invite users to a deleted company' }, { status: 400 });
    }

    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .ilike('email', emailNormalized)
      .maybeSingle();

    if (existingUser) {
      return NextResponse.json({ error: 'A user with this email already exists' }, { status: 409 });
    }

    const { data: existingInvitation } = await supabase
      .from('invitations')
      .select('id')
      .ilike('email', emailNormalized)
      .eq('status', 'pending')
      .maybeSingle();

    if (existingInvitation) {
      return NextResponse.json(
        { error: 'An invitation is already pending for this email' },
        { status: 409 },
      );
    }

    const randomPart = Math.random().toString(36).substring(2, 11);
    const invitationToken = `inv_${Date.now()}_${randomPart}`.replace(/[^a-zA-Z0-9_-]/g, '');
    const companyName = companyData.name;

    const role = 'trainee' as const;

    const invitationMetadata = {
      role,
      company_id: companyId,
      company_name: companyName,
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      phone: phone?.trim() || null,
      job_title: job_title?.trim() || null,
      department: department?.trim() || null,
      location: location?.trim() || null,
      date_of_birth: date_of_birth || null,
      invited_by: userId,
      invitation_token: invitationToken,
    };

    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || '').trim().replace(/\/+$/, '');
    if (!appUrl) {
      return NextResponse.json(
        {
          error: 'Server misconfiguration',
          details:
            'Set NEXT_PUBLIC_APP_URL (e.g. http://localhost:3000). Clerk needs an allowed redirect URL.',
        },
        { status: 500 },
      );
    }

    const redirectUrl = `${appUrl}/accept-invitation?token=${encodeURIComponent(invitationToken)}`;

    let clerkInvitation;
    try {
      clerkInvitation = await clerkClient.invitations.createInvitation({
        emailAddress: emailNormalized,
        redirectUrl,
        publicMetadata: invitationMetadata,
      });
    } catch (err) {
      if (isClerkAPIResponseError(err)) {
        const details =
          err.errors?.map((e) => e.longMessage || e.message).filter(Boolean).join(' — ') || err.message;
        return NextResponse.json(
          { error: 'Clerk rejected the invitation', details },
          { status: err.status && err.status >= 400 && err.status < 600 ? err.status : 422 },
        );
      }
      throw err;
    }

    const userDataPayload = {
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      phone: phone?.trim() || null,
      job_title: job_title?.trim() || null,
      department: department?.trim() || null,
      location: location?.trim() || null,
      date_of_birth: date_of_birth || null,
      company_name: companyName,
      invite_message: typeof message === 'string' ? message : null,
    };

    const { data: invitation, error: invitationError } = await supabase
      .from('invitations')
      .insert({
        email: emailNormalized,
        role,
        company_id: companyId,
        invited_by: userId,
        clerk_invitation_id: clerkInvitation.id,
        token: invitationToken,
        status: 'pending',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        user_data: userDataPayload,
      })
      .select()
      .single();

    if (invitationError) {
      console.error('Invitation DB insert failed:', invitationError);
      return NextResponse.json(
        { error: 'Failed to save invitation', details: invitationError.message },
        { status: 500 },
      );
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
      },
      message: 'Invitation sent. The trainee will receive an email to complete signup.',
    });
  } catch (error) {
    console.error('Error in create-trainee:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
