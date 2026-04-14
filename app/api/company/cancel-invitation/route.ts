import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { clerkClient } from '@clerk/nextjs/server';
import { getCompanyTraineeInvitation, requireCompanyAdminContext } from '@/lib/company-invitation-auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

/** Revoke Clerk invite (best-effort) and mark DB row cancelled. */
export async function POST(request: NextRequest) {
  const gate = await requireCompanyAdminContext();
  if (!gate.ok) {
    return gate.response;
  }
  const { companyId } = gate.ctx;

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
    return NextResponse.json({ error: 'Only pending invitations can be cancelled' }, { status: 400 });
  }

  if (invitation.clerk_invitation_id) {
    try {
      await clerkClient.invitations.revokeInvitation(invitation.clerk_invitation_id);
    } catch (e) {
      console.warn('Clerk revokeInvitation (continuing to cancel in DB):', e);
    }
  }

  const { error: updateError } = await supabase
    .from('invitations')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString(),
    })
    .eq('id', invitationId)
    .eq('company_id', companyId);

  if (updateError) {
    console.error('cancel invitation DB update:', updateError);
    return NextResponse.json({ error: 'Failed to cancel invitation' }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: 'Invitation cancelled' });
}
