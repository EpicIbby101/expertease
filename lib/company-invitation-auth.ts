import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthForApi } from '@/lib/auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export type CompanyAdminContext = {
  userId: string;
  companyId: string;
};

/** Clerk user id + company_id for the signed-in company admin. */
export async function requireCompanyAdminContext(): Promise<
  { ok: true; ctx: CompanyAdminContext } | { ok: false; response: NextResponse }
> {
  // Use currentUser() via getAuthForApi — same as create-trainee. `auth()` can throw
  // or return empty in Route Handlers when API middleware doesn't run full Clerk auth().
  const { userId } = await getAuthForApi();
  if (!userId) {
    return { ok: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  const { data: row, error } = await supabase
    .from('users')
    .select('role, company_id')
    .eq('user_id', userId)
    .single();

  if (error || !row?.company_id) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'User not associated with a company' }, { status: 400 }),
    };
  }

  if (row.role !== 'company_admin') {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Forbidden — company admin access required' }, { status: 403 }),
    };
  }

  return { ok: true, ctx: { userId, companyId: row.company_id } };
}

export type CompanyTraineeInvitationRow = {
  id: string;
  email: string;
  role: string;
  status: string;
  expires_at: string;
  accepted_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  user_data: Record<string, unknown> | null;
  clerk_invitation_id: string | null;
};

/** Trainee invitation for this company (by UUID id). */
export async function getCompanyTraineeInvitation(
  invitationId: string,
  companyId: string,
): Promise<{ row: CompanyTraineeInvitationRow } | { error: NextResponse }> {
  const { data, error } = await supabase
    .from('invitations')
    .select(
      'id, email, role, status, expires_at, accepted_at, created_at, updated_at, user_data, clerk_invitation_id',
    )
    .eq('id', invitationId)
    .eq('company_id', companyId)
    .eq('role', 'trainee')
    .maybeSingle();

  if (error) {
    console.error('getCompanyTraineeInvitation:', error);
    return { error: NextResponse.json({ error: 'Failed to load invitation' }, { status: 500 }) };
  }
  if (!data) {
    return { error: NextResponse.json({ error: 'Invitation not found' }, { status: 404 }) };
  }

  return { row: data as CompanyTraineeInvitationRow };
}
