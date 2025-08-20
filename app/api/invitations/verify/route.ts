import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    console.log('Verifying invitation token:', token);

    // Find the invitation by token (check both pending and accepted)
    const { data: invitation, error } = await supabase
      .from('invitations')
      .select('*')
      .eq('token', token)
      .in('status', ['pending', 'accepted'])
      .single();

    if (error || !invitation) {
      return NextResponse.json({ error: 'Invalid invitation token' }, { status: 404 });
    }

    // Check if invitation has expired
    if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Invitation has expired' }, { status: 410 });
    }

    // Return invitation details with status
    return NextResponse.json({
      valid: true,
      status: invitation.status, // 'pending' or 'accepted'
      invitation: {
        id: invitation.id,
        email: invitation.email,
        role: invitation.role,
        company_id: invitation.company_id,
        expires_at: invitation.expires_at,
        user_data: invitation.user_data,
        invited_by: invitation.invited_by,
        accepted_at: invitation.accepted_at
      }
    });

  } catch (error) {
    console.error('Error verifying invitation token:', error);
    return NextResponse.json({ error: 'Failed to verify invitation' }, { status: 500 });
  }
} 