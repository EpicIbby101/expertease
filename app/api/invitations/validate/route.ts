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

    // Get invitation with company information
    const { data: invitation, error } = await supabase
      .from('invitations')
      .select(`
        id,
        email,
        role,
        company_id,
        user_data,
        expires_at,
        status,
        companies!inner(name)
      `)
      .eq('token', token)
      .eq('status', 'pending')
      .single();

    if (error || !invitation) {
      return NextResponse.json({ error: 'Invalid or expired invitation' }, { status: 404 });
    }

    // Check if invitation has expired
    const now = new Date();
    const expiresAt = new Date(invitation.expires_at);
    
    if (now > expiresAt) {
      return NextResponse.json({ error: 'Invitation has expired' }, { status: 400 });
    }

    // Transform the data to include company name
    const invitationData = {
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      company_id: invitation.company_id,
      company_name: invitation.companies?.[0]?.name || null,
      user_data: invitation.user_data,
      expires_at: invitation.expires_at,
    };

    return NextResponse.json({ invitation: invitationData });

  } catch (error) {
    console.error('Error validating invitation:', error);
    return NextResponse.json({ error: 'Failed to validate invitation' }, { status: 500 });
  }
} 