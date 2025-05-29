import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { applyRateLimit } from '@/lib/ratelimit';
import { z } from 'zod';

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : undefined;

// Input validation schema
const checkoutSchema = z.object({
  userId: z.string().optional(),
  email: z.string().email().optional(),
  priceId: z.string().min(1, "Price ID is required"),
  subscription: z.boolean().optional().default(false)
});

export async function POST(req: NextRequest) {
  // Apply rate limiting
  const rateLimit = await applyRateLimit(req, "payment");
  if (!rateLimit.success) {
    return new NextResponse(
      JSON.stringify({ error: "Too many requests" }),
      { 
        status: 429, 
        headers: rateLimit.headers 
      }
    );
  }

  if (!stripe) {
    console.error('Missing STRIPE_SECRET_KEY environment variable');
    return NextResponse.json({ error: 'Stripe configuration error' }, { status: 500 });
  }

  // Parse and validate request body
  let body;
  try {
    body = await req.json();
    const result = checkoutSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ 
        error: 'Invalid request data',
        details: result.error.format() 
      }, { 
        status: 400,
        headers: rateLimit.headers
      });
    }
    body = result.data;
  } catch (e) {
    return NextResponse.json({ 
      error: 'Invalid JSON' 
    }, { 
      status: 400,
      headers: rateLimit.headers
    });
  }

  const { userId, email, priceId, subscription } = body;

  if (subscription) {
    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{ 
          price: priceId,
          quantity: 1 
        }],
        metadata: { 
          userId: userId?.toString() || '', 
          email: email || '',
          subscription: subscription ? 'true' : 'false'
        },
        mode: 'subscription',
        success_url: `${process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/cancel`,
        allow_promotion_codes: true,
      } as Stripe.Checkout.SessionCreateParams);

      return NextResponse.json({ sessionId: session.id }, { headers: rateLimit.headers });
    } catch (error) {
      console.error('Error creating checkout session:', error);
      return NextResponse.json({ error: 'Failed to create checkout session' }, { 
        status: 400,
        headers: rateLimit.headers
      });
    }
  } else {
    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{ 
          price: priceId,
          quantity: 1 
        }],
        metadata: { 
          userId: userId?.toString() || '', 
          email: email || '',
          subscription: subscription ? 'true' : 'false'
        },
        mode: 'payment',
        success_url: `${process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/cancel`,
      } as Stripe.Checkout.SessionCreateParams);

      return NextResponse.json({ sessionId: session.id }, { headers: rateLimit.headers });
    } catch (error) {
      console.error('Error creating checkout session:', error);
      return NextResponse.json({ error: 'Failed to create checkout session' }, { 
        status: 400,
        headers: rateLimit.headers
      });
    }
  }
}
