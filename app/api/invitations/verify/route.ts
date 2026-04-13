import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    // Decode the token in case it was URL-encoded
    token = decodeURIComponent(token);
    console.log('Verifying invitation token:', token);
    console.log('All URL params:', Object.fromEntries(searchParams.entries()));

    // First, let's check what tokens exist in the database for debugging
    const { data: allInvitations, error: allError } = await supabase
      .from('invitations')
      .select('token, status, email, created_at')
      .order('created_at', { ascending: false })
      .limit(5);
    
    console.log('Recent invitations in database (last 5):', allInvitations);
    console.log('Searching for token:', token);
    console.log('Token type:', typeof token);
    console.log('Token exact value:', JSON.stringify(token));
    
    // Find the invitation by token (check both pending and accepted)
    // Use .maybeSingle() first, or query without .single() and take the first result
    const { data: invitations, error: queryError } = await supabase
      .from('invitations')
      .select('*')
      .eq('token', token)
      .in('status', ['pending', 'accepted'])
      .limit(1);

    console.log('Query result:', { invitations, queryError, count: invitations?.length });

    if (queryError) {
      console.error('Database error when looking up invitation:', queryError);
      console.error('Token being searched:', token);
      return NextResponse.json({ 
        error: 'Invalid invitation token',
        details: queryError.message 
      }, { status: 404 });
    }
    
    // Get the first invitation if multiple exist (shouldn't happen due to unique constraint, but handle it)
    const invitation = invitations && invitations.length > 0 ? invitations[0] : null;
    
    if (!invitation) {
      console.error('No invitation found for token:', token);
      console.error('Token length:', token.length);
      console.error('Token characters:', Array.from(token).map(c => `${c}(${c.charCodeAt(0)})`).join(', '));
      
      // Try to see if there are any invitations at all for debugging
      const { count } = await supabase
        .from('invitations')
        .select('*', { count: 'exact', head: true });
      console.log('Total invitations in database:', count);
      
      // Try to find by partial token match
      const { data: partialMatches } = await supabase
        .from('invitations')
        .select('token, status, email')
        .like('token', `%${token.substring(token.length - 10)}%`)
        .limit(5);
      console.log('Partial token matches:', partialMatches);
      
      // Try a case-insensitive search as a fallback
      const { data: caseInsensitiveInvitations } = await supabase
        .from('invitations')
        .select('*')
        .ilike('token', token)
        .in('status', ['pending', 'accepted'])
        .limit(1);
      
      const caseInsensitiveInvitation = caseInsensitiveInvitations && caseInsensitiveInvitations.length > 0 ? caseInsensitiveInvitations[0] : null;
      
      if (caseInsensitiveInvitation) {
        console.log('Found invitation with case-insensitive search');
        return NextResponse.json({
          valid: true,
          status: caseInsensitiveInvitation.status,
          invitation: {
            id: caseInsensitiveInvitation.id,
            email: caseInsensitiveInvitation.email,
            role: caseInsensitiveInvitation.role,
            company_id: caseInsensitiveInvitation.company_id,
            expires_at: caseInsensitiveInvitation.expires_at,
            user_data: caseInsensitiveInvitation.user_data,
            invited_by: caseInsensitiveInvitation.invited_by,
            accepted_at: caseInsensitiveInvitation.accepted_at
          }
        });
      }
      
      // Try searching with trimmed token in case of whitespace issues
      const trimmedToken = token.trim();
      if (trimmedToken !== token) {
        console.log('Trying with trimmed token');
        const { data: trimmedInvitations } = await supabase
          .from('invitations')
          .select('*')
          .eq('token', trimmedToken)
          .in('status', ['pending', 'accepted'])
          .limit(1);
        
        const trimmedInvitation = trimmedInvitations && trimmedInvitations.length > 0 ? trimmedInvitations[0] : null;
        
        if (trimmedInvitation) {
          console.log('Found invitation with trimmed token');
          return NextResponse.json({
            valid: true,
            status: trimmedInvitation.status,
            invitation: {
              id: trimmedInvitation.id,
              email: trimmedInvitation.email,
              role: trimmedInvitation.role,
              company_id: trimmedInvitation.company_id,
              expires_at: trimmedInvitation.expires_at,
              user_data: trimmedInvitation.user_data,
              invited_by: trimmedInvitation.invited_by,
              accepted_at: trimmedInvitation.accepted_at
            }
          });
        }
      }
      
      return NextResponse.json({ 
        error: 'Invalid invitation token',
        debug: {
          tokenLength: token.length,
          tokenPreview: token.substring(0, 20) + '...',
          tokenValue: token
        }
      }, { status: 404 });
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