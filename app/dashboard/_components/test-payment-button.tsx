'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useUser } from '@clerk/nextjs';
import { loadStripe } from '@stripe/stripe-js';
import config from '@/config';

// Load Stripe outside of component render to avoid recreating Stripe object on every render
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY as string);

export function TestPaymentButton() {
  // Return null if auth is disabled to prevent Clerk components from rendering
  if (!config?.auth?.enabled) {
    return null;
  }
  
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useUser();

  const handleTestPayment = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "You need to be logged in to make payments",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      
      // Create a checkout session
      const response = await fetch('/api/payments/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          email: user.primaryEmailAddress?.emailAddress,
          priceId: process.env.NEXT_PUBLIC_STRIPE_PRODUCT_1_PRICE_ID,
          subscription: true,
        }),
      });
      
      const { sessionId, error } = await response.json();
      
      if (error) {
        console.error('Error creating checkout session:', error);
        throw new Error(error);
      }
      
      // Redirect to Stripe Checkout using the Stripe SDK
      const stripe = await stripePromise;
      if (stripe) {
        const { error } = await stripe.redirectToCheckout({ sessionId });
        if (error) {
          console.error('Stripe redirect error:', error);
          throw error;
        }
      }
    } catch (error) {
      console.error('Payment flow error:', error);
      toast({
        title: 'Error',
        description: 'Failed to initiate payment flow. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleTestPayment}
      disabled={isLoading}
      variant="default"
      className="gap-1"
    >
      {isLoading ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Processing...
        </>
      ) : (
        'Test Payment Flow'
      )}
    </Button>
  );
} 