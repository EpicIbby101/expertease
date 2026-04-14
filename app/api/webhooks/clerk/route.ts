import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { clerkClient } from '@clerk/nextjs/server';
import { isAppRole, normalizeInviteEmail } from '@/lib/invitation-role';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const headerPayload = await headers();
    const svix_id = headerPayload.get("svix-id");
    const svix_timestamp = headerPayload.get("svix-timestamp");
    const svix_signature = headerPayload.get("svix-signature");

    // If there are no headers, error out
    if (!svix_id || !svix_timestamp || !svix_signature) {
      return new Response('Error occured -- no svix headers', {
        status: 400
      });
    }

    // Get the body
    const payload = await request.json();
    const body = JSON.stringify(payload);

    // Create a new Svix instance with your secret.
    const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET || '');

    let evt: any;

    // Verify the payload with the headers
    try {
      evt = wh.verify(body, {
        "svix-id": svix_id,
        "svix-timestamp": svix_timestamp,
        "svix-signature": svix_signature,
      });
    } catch (err) {
      console.error('Error verifying webhook:', err);
      return new Response('Error occured', {
        status: 400
      });
    }

    // Handle the webhook
    const eventType = evt.type;
    console.log('Webhook event received:', eventType);

    if (eventType === 'user.created') {
      const { id, email_addresses, public_metadata, first_name, last_name } = evt.data;
      const emailRaw = email_addresses[0]?.email_address;
      const emailNorm = normalizeInviteEmail(emailRaw);

      console.log('User created event details:');
      console.log('- User ID:', id);
      console.log('- Email (raw):', emailRaw, '| normalized:', emailNorm);
      console.log('- First Name:', first_name);
      console.log('- Last Name:', last_name);
      console.log('- Public metadata:', JSON.stringify(public_metadata, null, 2));

      if (!emailNorm) {
        console.error('No email found for user:', id);
        return NextResponse.json({ error: 'No email found' }, { status: 400 });
      }

      const meta =
        public_metadata && typeof public_metadata === 'object' && !Array.isArray(public_metadata)
          ? (public_metadata as Record<string, unknown>)
          : {};

      try {
        // Pending invite by normalized email (avoid .single() — multiple rows / case issues break it)
        const { data: byEmailRows, error: inviteEmailErr } = await supabase
          .from('invitations')
          .select('*')
          .ilike('email', emailNorm)
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(1);

        if (inviteEmailErr) {
          console.error('Error querying invitations by email:', inviteEmailErr);
        }

        let pendingInvitation = byEmailRows?.[0] ?? null;

        // Fallback: Clerk copies invitation publicMetadata onto the user — match our token
        const tokenFromMeta =
          typeof meta.invitation_token === 'string' ? meta.invitation_token.trim() : '';
        if (!pendingInvitation && tokenFromMeta) {
          const { data: byToken, error: tokErr } = await supabase
            .from('invitations')
            .select('*')
            .eq('token', tokenFromMeta)
            .eq('status', 'pending')
            .maybeSingle();

          if (tokErr) {
            console.error('Error querying invitations by token:', tokErr);
          } else if (byToken) {
            pendingInvitation = byToken;
            console.log('Matched pending invitation by invitation_token from Clerk metadata');
          }
        }

        const metaIndicatesInvite =
          isAppRole(meta.role) || Boolean(tokenFromMeta) || Boolean(meta.company_id);
        const isInvitedFlow = Boolean(pendingInvitation) || metaIndicatesInvite;

        if (isInvitedFlow) {
          const roleFromRow = pendingInvitation && isAppRole(pendingInvitation.role)
            ? pendingInvitation.role
            : null;
          const roleFromMeta = isAppRole(meta.role) ? meta.role : null;
          const resolvedRole = roleFromRow ?? roleFromMeta ?? 'trainee';

          const companyIdFromRow = pendingInvitation?.company_id ?? null;
          const companyIdMeta = typeof meta.company_id === 'string' ? meta.company_id : null;
          const resolvedCompanyId = companyIdFromRow ?? companyIdMeta;

          let companyName: string | null =
            typeof meta.company_name === 'string' ? meta.company_name : null;
          if (resolvedCompanyId) {
            const { data: companyData, error: companyError } = await supabase
              .from('companies')
              .select('name')
              .eq('id', resolvedCompanyId)
              .maybeSingle();

            if (companyError) {
              console.error('Error fetching company name:', companyError);
            } else if (companyData?.name) {
              companyName = companyData.name;
            }
          }

          const ud = pendingInvitation?.user_data as Record<string, unknown> | null | undefined;

          const invitationMetadata = {
            role: resolvedRole,
            company_id: resolvedCompanyId,
            company_name: companyName,
            first_name:
              (typeof ud?.first_name === 'string' ? ud.first_name : null) ||
              first_name ||
              (typeof meta.first_name === 'string' ? meta.first_name : null),
            last_name:
              (typeof ud?.last_name === 'string' ? ud.last_name : null) ||
              last_name ||
              (typeof meta.last_name === 'string' ? meta.last_name : null),
            phone: typeof ud?.phone === 'string' ? ud.phone : null,
            job_title: typeof ud?.job_title === 'string' ? ud.job_title : null,
            department: typeof ud?.department === 'string' ? ud.department : null,
            location: typeof ud?.location === 'string' ? ud.location : null,
            date_of_birth: typeof ud?.date_of_birth === 'string' ? ud.date_of_birth : null,
          };

          if (roleFromRow && roleFromMeta && roleFromRow !== roleFromMeta) {
            console.warn('Invitation role mismatch (DB vs Clerk metadata); using DB row:', {
              roleFromRow,
              roleFromMeta,
            });
          }

          console.log('Provisioning invited user with resolved role:', resolvedRole, {
            hadPendingRow: Boolean(pendingInvitation),
            metaRole: meta.role,
          });

          try {
            await clerkClient.users.updateUser(id, {
              publicMetadata: invitationMetadata,
            });
            console.log('Successfully synced public_metadata in Clerk');
          } catch (clerkError) {
            console.error('Error updating user public_metadata in Clerk:', clerkError);
          }

          const { data: user, error: userError } = await supabase
            .from('users')
            .insert({
              user_id: id,
              email: emailNorm,
              first_name: invitationMetadata.first_name,
              last_name: invitationMetadata.last_name,
              role: resolvedRole,
              company_id: resolvedCompanyId,
              company_name: companyName,
              phone: invitationMetadata.phone,
              job_title: invitationMetadata.job_title,
              department: invitationMetadata.department,
              location: invitationMetadata.location,
              date_of_birth: invitationMetadata.date_of_birth,
              is_active: true,
              profile_completed: false,
            })
            .select()
            .single();

          if (userError) {
            console.error('Error creating user in Supabase:', userError);
            return NextResponse.json({ error: 'Failed to create user in Supabase' }, { status: 500 });
          }

          console.log('User created from invitation:', user);

          const invitationRowId = pendingInvitation?.id;
          if (invitationRowId) {
            const { error: updateError } = await supabase
              .from('invitations')
              .update({
                status: 'accepted',
                accepted_at: new Date().toISOString(),
              })
              .eq('id', invitationRowId);

            if (updateError) {
              console.error('Error updating invitation status:', updateError);
            }
          } else {
            const { error: updByEmail } = await supabase
              .from('invitations')
              .update({
                status: 'accepted',
                accepted_at: new Date().toISOString(),
              })
              .ilike('email', emailNorm)
              .eq('status', 'pending');

            if (updByEmail) {
              console.error('Error marking invitation accepted by email:', updByEmail);
            }
          }
        } else {
          console.log('Creating regular user (no invitation signals):', {
            id,
            email: emailNorm,
            first_name,
            last_name,
          });

          const { data: user, error: userError } = await supabase.from('users').insert({
            user_id: id,
            email: emailNorm,
            first_name: first_name || null,
            last_name: last_name || null,
            role: 'trainee',
            is_active: true,
            profile_completed: false,
          })
            .select()
            .single();

          if (userError) {
            console.error('Error creating user in Supabase:', userError);
            return NextResponse.json({ error: 'Failed to create user in Supabase' }, { status: 500 });
          }

          console.log('Regular user created successfully:', user);
        }
      } catch (error) {
        console.error('Error processing user creation:', error);
        return NextResponse.json({ error: 'Failed to process user creation' }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook error' }, { status: 500 });
  }
}