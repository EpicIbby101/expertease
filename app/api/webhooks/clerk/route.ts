import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Webhook } from 'svix';
import { headers } from 'next/headers';

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

      // Check if this user was created from an invitation (has role metadata)
      if (public_metadata && public_metadata.role) {
        console.log('Creating user from invitation:', { id, email, metadata: public_metadata });

        // Create user in Supabase
        const { data: user, error: userError } = await supabase
          .from('users')
          .insert({
            user_id: id,
            email: email,
            first_name: (public_metadata.first_name as string) || first_name || null,
            last_name: (public_metadata.last_name as string) || last_name || null,
            role: public_metadata.role as string,
            company_id: (public_metadata.company_id as string) || null,
            phone: (public_metadata.phone as string) || null,
            job_title: (public_metadata.job_title as string) || null,
            department: (public_metadata.department as string) || null,
            location: (public_metadata.location as string) || null,
            date_of_birth: (public_metadata.date_of_birth as string) || null,
            is_active: true,
            profile_completed: false,
          })
          .select()
          .single();

        if (userError) {
          console.error('Error creating user in Supabase:', userError);
          return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
        }

        // Mark invitation as accepted
        const { error: invitationError } = await supabase
          .from('invitations')
          .update({
            status: 'accepted',
            accepted_at: new Date().toISOString(),
          })
          .eq('email', email)
          .eq('status', 'pending');

        if (invitationError) {
          console.error('Error updating invitation:', invitationError);
          // Don't fail the whole process if this fails
        }

        console.log('User created successfully from invitation:', user);
      } else {
        // Regular user signup (not from invitation)
        console.log('Creating regular user (no invitation metadata):', { id, email, first_name, last_name });
        console.log('Public metadata was:', public_metadata);
        
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
          console.error('Error creating user in Supabase:', userError);
          return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
        }

        console.log('Regular user created successfully:', user);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook error' }, { status: 500 });
  }
}