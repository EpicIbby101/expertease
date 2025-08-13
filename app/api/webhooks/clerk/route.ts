import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { clerkClient } from '@clerk/nextjs/server';

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
    console.log('Full event data:', JSON.stringify(evt.data, null, 2));

    if (eventType === 'user.created') {
      const { id, email_addresses, public_metadata, first_name, last_name } = evt.data;
      const email = email_addresses[0]?.email_address;

      console.log('User created event details:');
      console.log('- User ID:', id);
      console.log('- Email:', email);
      console.log('- First Name:', first_name);
      console.log('- Last Name:', last_name);
      console.log('- Public metadata:', JSON.stringify(public_metadata, null, 2));

      if (!email) {
        console.error('No email found for user:', id);
        return NextResponse.json({ error: 'No email found' }, { status: 400 });
      }

      try {
        console.log('🔍 Looking for invitation for email:', email);
        
        // First, try to find the invitation in our Supabase table
        const { data: pendingInvitation, error: invitationError } = await supabase
          .from('invitations')
          .select('*')
          .eq('email', email)
          .eq('status', 'pending')
          .single();

        if (invitationError) {
          if (invitationError.code === 'PGRST116') {
            console.log('❌ No pending invitation found for email:', email);
          } else {
            console.error('❌ Error checking for pending invitation:', invitationError);
          }
        } else {
          console.log('✅ Found pending invitation in Supabase:', pendingInvitation);
        }

        if (pendingInvitation) {
          console.log('🎯 Processing invitation for user:', pendingInvitation);
          
          // This user was created from an invitation - apply the invitation metadata
          const invitationMetadata = {
            role: pendingInvitation.role,
            company_id: pendingInvitation.company_id,
            first_name: pendingInvitation.user_data?.first_name || first_name || null,
            last_name: pendingInvitation.user_data?.last_name || last_name || null,
            phone: pendingInvitation.user_data?.phone || null,
            job_title: pendingInvitation.user_data?.job_title || null,
            department: pendingInvitation.user_data?.department || null,
            location: pendingInvitation.user_data?.location || null,
            date_of_birth: pendingInvitation.user_data?.date_of_birth || null,
          };

          console.log('📝 Applying invitation metadata to user:', invitationMetadata);

          // Update the user's public_metadata in Clerk with the invitation data
          try {
            await clerkClient.users.updateUser(id, {
              publicMetadata: invitationMetadata
            });
            console.log('✅ Successfully updated user public_metadata in Clerk');
          } catch (clerkError) {
            console.error('❌ Error updating user public_metadata in Clerk:', clerkError);
            // Continue even if Clerk update fails
          }

          // Create user in Supabase with invitation metadata - this is the key fix!
          const { data: user, error: userError } = await supabase
            .from('users')
            .insert({
              user_id: id,
              email: email,
              first_name: invitationMetadata.first_name,
              last_name: invitationMetadata.last_name,
              role: invitationMetadata.role,
              company_id: invitationMetadata.company_id,
              phone: invitationMetadata.phone,
              job_title: invitationMetadata.job_title,
              department: invitationMetadata.department,
              location: invitationMetadata.location,
              date_of_birth: invitationMetadata.date_of_birth,
              is_active: true,
              profile_completed: false, // Will be completed when they fill out profile
            })
            .select()
            .single();

          if (userError) {
            console.error('❌ Error creating user in Supabase:', userError);
            return NextResponse.json({ error: 'Failed to create user in Supabase' }, { status: 500 });
          }

          console.log('✅ User created successfully from invitation with correct role and company:', user);
          
        } else {
          // No invitation found - this might be a regular signup
          // But let's double-check by looking for any invitation with this email (including accepted ones)
          const { data: anyInvitation } = await supabase
            .from('invitations')
            .select('*')
            .eq('email', email)
            .single();

          if (anyInvitation) {
            console.log('⚠️ Found invitation (but not pending):', anyInvitation);
            console.log('⚠️ This suggests the user was invited but the invitation status is:', anyInvitation.status);
          }

          // Regular user signup (no invitation found) - create user in Supabase
          console.log('👤 Creating regular user (no invitation found):', { id, email, first_name, last_name });
          
          const { data: user, error: userError } = await supabase
            .from('users')
            .insert({
              user_id: id,
              email: email,
              first_name: first_name || null,
              last_name: last_name || null,
              role: 'trainee', // Default role for regular signups
              is_active: true,
              profile_completed: false,
            })
            .select()
            .single();

          if (userError) {
            console.error('❌ Error creating user in Supabase:', userError);
            return NextResponse.json({ error: 'Failed to create user in Supabase' }, { status: 500 });
          }

          console.log('✅ Regular user created successfully:', user);
        }
      } catch (error) {
        console.error('❌ Error processing user creation:', error);
        return NextResponse.json({ error: 'Failed to process user creation' }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Webhook error:', error);
    return NextResponse.json({ error: 'Webhook error' }, { status: 500 });
  }
}