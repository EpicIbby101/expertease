import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { clerkClient } from '@clerk/nextjs/server';
import { isClerkAPIResponseError } from '@clerk/shared/error';
import { getCompanyTraineeInvitation, requireCompanyAdminContext } from '@/lib/company-invitation-auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

function newInvitationToken(): string {
  const randomPart = Math.random().toString(36).substring(2, 11);
  return `inv_${Date.now()}_${randomPart}`.replace(/[^a-zA-Z0-9_-]/g, '');
}

/** Revoke prior Clerk invite, create a new one, refresh token + expiry in DB. */
export async function POST(request: NextRequest) {
  const gate = await requireCompanyAdminContext();
  if (!gate.ok) {
    return gate.response;
  }
  const { userId, companyId } = gate.ctx;

  let body: { invitationId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const invitationId = typeof body.invitationId === 'string' ? body.invitationId.trim() : '';
  if (!invitationId) {
    return NextResponse.json({ error: 'invitationId is required' }, { status: 400 });
  }

  const loaded = await getCompanyTraineeInvitation(invitationId, companyId);
  if ('error' in loaded) {
    return loaded.error;
  }
  const invitation = loaded.row;

  if (invitation.status !== 'pending') {
    return NextResponse.json({ error: 'Only pending invitations can be resent' }, { status: 400 });
  }

  const { data: companyData, error: companyError } = await supabase
    .from('companies')
    .select('id, name, deleted_at')
    .eq('id', companyId)
    .single();

  if (companyError || !companyData?.name || companyData.deleted_at) {
    return NextResponse.json({ error: 'Company not available' }, { status: 400 });
  }

  const ud = invitation.user_data as Record<string, unknown> | null | undefined;
  const firstName = typeof ud?.first_name === 'string' ? ud.first_name.trim() : '';
  const lastName = typeof ud?.last_name === 'string' ? ud.last_name.trim() : '';
  if (firstName.length < 2 || lastName.length < 2) {
    return NextResponse.json(
      { error: 'Invitation is missing first/last name in user_data; cancel and send a new invite.' },
      { status: 400 },
    );
  }

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || '').trim().replace(/\/+$/, '');
  if (!appUrl) {
    return NextResponse.json(
      {
        error: 'Server misconfiguration',
        details: 'Set NEXT_PUBLIC_APP_URL so Clerk can use the redirect URL.',
      },
      { status: 500 },
    );
  }

  const invitationToken = newInvitationToken();
  const redirectUrl = `${appUrl}/accept-invitation?token=${encodeURIComponent(invitationToken)}`;

  const invitationMetadata = {
    role: 'trainee' as const,
    company_id: companyId,
    company_name: companyData.name,
    first_name: firstName,
    last_name: lastName,
    phone: typeof ud?.phone === 'string' ? ud.phone.trim() || null : null,
    job_title: typeof ud?.job_title === 'string' ? ud.job_title.trim() || null : null,
    department: typeof ud?.department === 'string' ? ud.department.trim() || null : null,
    location: typeof ud?.location === 'string' ? ud.location.trim() || null : null,
    date_of_birth: typeof ud?.date_of_birth === 'string' ? ud.date_of_birth : null,
    invited_by: userId,
    invitation_token: invitationToken,
  };

  if (invitation.clerk_invitation_id) {
    try {
      await clerkClient.invitations.revokeInvitation(invitation.clerk_invitation_id);
    } catch (e) {
      console.warn('Clerk revokeInvitation before resend (may already be revoked):', e);
    }
  }

  let clerkInvitation;
  try {
    clerkInvitation = await clerkClient.invitations.createInvitation({
      emailAddress: invitation.email,
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

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const { error: updateError } = await supabase
    .from('invitations')
    .update({
      token: invitationToken,
      clerk_invitation_id: clerkInvitation.id,
      expires_at: expiresAt,
      invited_by: userId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', invitationId)
    .eq('company_id', companyId)
    .eq('status', 'pending');

  if (updateError) {
    console.error('resend invitation DB update:', updateError);
    return NextResponse.json({ error: 'Failed to update invitation after Clerk send' }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    message: 'Invitation resent. The trainee will receive a new signup email.',
    expires_at: expiresAt,
  });
}
