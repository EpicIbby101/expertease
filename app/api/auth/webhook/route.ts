import { userCreate } from '@/utils/data/user/userCreate';
import { userUpdate } from '@/utils/data/user/userUpdate';
import { WebhookEvent } from '@clerk/nextjs/server';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { sendWelcomeEmail } from '@/lib/welcome-email-service';

export async function POST(req: Request) {
  console.log(`[CLERK WEBHOOK] Received webhook request at ${new Date().toISOString()}`);
  
  // You can find this in the Clerk Dashboard -> Webhooks -> choose the webhook
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    console.error('[CLERK WEBHOOK] Missing WEBHOOK_SECRET from Clerk Dashboard in .env or .env.local');
    return new Response('Webhook configuration error', {
      status: 500,
    });
  }

  // Get the headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    console.error('[CLERK WEBHOOK] Error - missing Svix headers');
    return new Response('Error occured -- no svix headers', {
      status: 400,
    });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  console.log(`[CLERK WEBHOOK] Processing event type: ${payload?.type}, user ID: ${payload?.data?.id}`);

  // Create a new SVIX instance with your secret.
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent;
    console.log(`[CLERK WEBHOOK] Signature verified for event ID: ${svix_id}`);
  } catch (err) {
    console.error('[CLERK WEBHOOK] Error verifying webhook:', err);
    return new Response('Error occured', {
      status: 400,
    });
  }

  // Get the ID and type
  const { id } = evt.data;
  const eventType = evt.type;

  switch (eventType) {
    case 'user.created':
      try {
        console.log(`[CLERK WEBHOOK] Processing user.created event for user ID: ${id}`);
        
        const userData = {
          email: payload?.data?.email_addresses?.[0]?.email_address,
          first_name: payload?.data?.first_name,
          last_name: payload?.data?.last_name,
          profile_image_url: payload?.data?.profile_image_url,
          user_id: payload?.data?.id,
        };
        
        console.log(`[CLERK WEBHOOK] Creating user with data:`, userData);
        
        await userCreate(userData);

        console.log(`[CLERK WEBHOOK] User successfully created in database for user ID: ${id}`);
        
        // Send welcome email
        if (userData.email) {
          console.log(`[CLERK WEBHOOK] Sending welcome email to ${userData.email}`);
          await sendWelcomeEmail({
            to: userData.email,
            firstName: userData.first_name,
          });
        }
        
        return NextResponse.json({
          status: 200,
          message: 'User info inserted and welcome email sent',
        });
      } catch (error: any) {
        console.error(`[CLERK WEBHOOK] Error creating user in database:`, error);
        return NextResponse.json({
          status: 400,
          message: error.message,
        });
      }
      break;

    case 'user.updated':
      try {
        console.log(`[CLERK WEBHOOK] Processing user.updated event for user ID: ${id}`);
        
        const userData = {
          email: payload?.data?.email_addresses?.[0]?.email_address,
          first_name: payload?.data?.first_name,
          last_name: payload?.data?.last_name,
          profile_image_url: payload?.data?.profile_image_url,
          user_id: payload?.data?.id,
        };
        
        console.log(`[CLERK WEBHOOK] Updating user with data:`, userData);
        
        await userUpdate(userData);

        console.log(`[CLERK WEBHOOK] User successfully updated in database for user ID: ${id}`);
        
        return NextResponse.json({
          status: 200,
          message: 'User info updated',
        });
      } catch (error: any) {
        console.error(`[CLERK WEBHOOK] Error updating user in database:`, error);
        return NextResponse.json({
          status: 400,
          message: error.message,
        });
      }
      break;

    default:
      console.warn(`[CLERK WEBHOOK] Unhandled event type: ${eventType}`);
      return new Response('Error occured -- unhandeled event type', {
        status: 400,
      });
  }

  return new Response('', { status: 201 });
}
