import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireCompanyAdminContext } from '@/lib/company-invitation-auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const STATUS_FILTERS = ['all', 'pending', 'accepted', 'expired', 'cancelled'] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

function isStatusFilter(s: string): s is StatusFilter {
  return (STATUS_FILTERS as readonly string[]).includes(s);
}

/** List trainee invitations for the company admin's company (+ status counts). */
export async function GET(request: NextRequest) {
  try {
    const gate = await requireCompanyAdminContext();
    if (!gate.ok) {
      return gate.response;
    }
    const { companyId } = gate.ctx;

    const raw = request.nextUrl.searchParams.get('status') ?? 'all';
    if (!isStatusFilter(raw)) {
      return NextResponse.json({ error: 'Invalid status (use all|pending|accepted|expired|cancelled)' }, { status: 400 });
    }
    const statusFilter = raw;

    const countFor = async (status: string) => {
      const { count, error } = await supabase
        .from('invitations')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .eq('role', 'trainee')
        .eq('status', status);
      if (error) {
        console.error('invitation count error:', error);
        return 0;
      }
      return count ?? 0;
    };

    const [pendingC, acceptedC, expiredC, cancelledC] = await Promise.all([
      countFor('pending'),
      countFor('accepted'),
      countFor('expired'),
      countFor('cancelled'),
    ]);

    let listQuery = supabase
      .from('invitations')
      .select(
        'id, email, role, status, expires_at, accepted_at, created_at, updated_at, user_data, clerk_invitation_id',
      )
      .eq('company_id', companyId)
      .eq('role', 'trainee')
      .order('created_at', { ascending: false })
      .limit(500);

    if (statusFilter !== 'all') {
      listQuery = listQuery.eq('status', statusFilter);
    }

    const { data: invitations, error: listError } = await listQuery;

    if (listError) {
      console.error('invitations list error:', listError);
      return NextResponse.json({ error: 'Failed to load invitations' }, { status: 500 });
    }

    const total = pendingC + acceptedC + expiredC + cancelledC;

    return NextResponse.json({
      invitations: invitations ?? [],
      counts: {
        total,
        pending: pendingC,
        accepted: acceptedC,
        expired: expiredC,
        cancelled: cancelledC,
      },
    });
  } catch (e) {
    console.error('GET /api/company/invitations:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
