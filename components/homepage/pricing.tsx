'use client';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import React, { useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import axios from 'axios';
import { loadStripe } from '@stripe/stripe-js';
import { toast } from 'sonner';
import { TITLE_TAILWIND_CLASS } from '@/utils/constants';
import { useRouter } from 'next/navigation';
import config from '@/config';
import { motion, useInView } from 'framer-motion';

type PricingSwitchProps = {
  isYearly: boolean;
  togglePricingPeriod: (value: string) => void;
};

type PricingCardProps = {
  title: string;
  monthlyPrice?: number;
  yearlyPrice?: number;
  description: string;
  features: string[];
  priceId?: string;
  btnText?: string;
  popular?: boolean;
  exclusive?: boolean;
  isYearly?: boolean;
  user: any;
  handleCheckout: (priceId: string) => Promise<void>;
  tier?: number;
};

const PricingHeader = ({ title, subtitle }: { title: string; subtitle: string }) => (
  <section className="text-center">
    <h1
      className={`${TITLE_TAILWIND_CLASS} mt-2 font-semibold tracking-tight dark:text-white text-gray-900`}
    >
      {title}
    </h1>
    <p className="text-gray-600 dark:text-gray-400 pt-1">{subtitle}</p>
    <br />
  </section>
);

const PricingSwitch = ({ isYearly, togglePricingPeriod }: PricingSwitchProps) => {
  return (
    <div className="mx-auto flex items-center justify-center space-x-4 mb-8">
      <span 
        className={`text-sm ${!isYearly ? 'font-semibold text-white' : 'text-gray-400'}`}
        onClick={() => togglePricingPeriod('0')}
        style={{ cursor: 'pointer' }}
      >
        Monthly
      </span>
      
      <div className="relative h-7 w-14 rounded-full bg-gray-800 cursor-pointer" onClick={() => togglePricingPeriod(isYearly ? '0' : '1')}>
        <div 
          className={`absolute top-1 h-5 w-5 rounded-full bg-green-500 transition-all duration-300 ${isYearly ? 'left-8' : 'left-1'}`} 
        />
      </div>
      
      <span 
        className={`text-sm ${isYearly ? 'font-semibold text-white' : 'text-gray-400'}`}
        onClick={() => togglePricingPeriod('1')}
        style={{ cursor: 'pointer' }}
      >
        Yearly
      </span>
    </div>
  );
};

const PricingCard = ({
  title,
  monthlyPrice,
  yearlyPrice,
  description,
  features,
  priceId,
  btnText = 'Get started',
  popular,
  exclusive,
  isYearly,
  user,
  handleCheckout,
  tier = 0,
}: PricingCardProps) => {
  const router = useRouter();
  return (
    <motion.div
      className={cn('flex flex-col justify-between w-full', {
        'lg:scale-105 z-10': popular,
      })}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: tier * 0.1 }}
    >
      <Card
        className={cn('h-full min-w-[260px]', {
          'border border-green-500/20 shadow-lg shadow-green-500/5 dark:shadow-green-500/10': popular,
          'bg-black border-gray-800 hover:border-green-500/20 transition-all duration-200': !popular,
          'bg-gradient-to-br from-black to-green-950 border-green-500/20': popular,
        })}
      >
        <CardHeader className="pb-6">
          <CardTitle className={cn('text-xl font-medium text-white')}>{title}</CardTitle>
          <div className="flex items-baseline gap-1 mt-4">
            <span className="text-5xl font-bold text-white">
              ${yearlyPrice && isYearly ? yearlyPrice : monthlyPrice}
            </span>
            <span className="text-sm font-normal text-gray-400">
              {yearlyPrice && isYearly ? '/year' : '/month'}
            </span>
          </div>
          <CardDescription className="pt-3 h-12 text-gray-400">{description}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 py-4">
          {features.map((feature) => (
            <CheckItem key={feature} text={feature} />
          ))}
        </CardContent>
        <CardFooter className="pt-6 pb-8">
          <Button
            onClick={() => {
              priceId
                ? handleCheckout(priceId)
                : router.push(
                    `${config.auth.enabled && !user ? '/sign-up?redirectUrl=' : ''}/contact`
                  );
            }}
            className={cn('w-full py-6', {
              'bg-gradient-to-r from-green-400 to-emerald-600 hover:from-green-500 hover:to-emerald-700 text-white': popular,
              'bg-black text-white hover:bg-gray-900 border border-gray-800 hover:border-green-500/20': !popular,
            })}
          >
            {btnText}
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

const CheckItem = ({ text }: { text: string }) => (
  <div className="flex items-center gap-3">
    <CheckCircle2 size={20} className="shrink-0 text-green-400" />
    <p className="text-white text-sm">{text}</p>
  </div>
);

export default function Pricing() {
  const [isYearly, setIsYearly] = useState<boolean>(false);
  const togglePricingPeriod = (value: string) => setIsYearly(parseInt(value) === 1);
  
  // Auth-related state - simplify since we know auth is disabled
  const [user, setUser] = useState<any>(null);
  const [isLoaded, setIsLoaded] = useState<boolean>(true); // Set to true initially since auth is disabled
  const [isSignedIn, setIsSignedIn] = useState<boolean>(false);
  
  const router = useRouter();
  const [stripePromise, setStripePromise] = useState<Promise<any> | null>(null);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, amount: 0.2 });

  useEffect(() => {
    // Only load Stripe if payments are enabled
    if (config.payments.enabled) {
      setStripePromise(loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!));
    }
  }, []);

  const handleCheckout = async (priceId: string) => {
    if (!config.payments.enabled) {
      toast.error('Payments are not configured');
      return;
    }

    if (!user && config.auth.enabled) {
      toast('Please sign in to continue', {
        description: 'You need to be signed in to make a purchase',
        action: {
          label: 'Sign In',
          onClick: () => {
            router.push('/sign-in');
          },
        },
      });
      return;
    }

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user?.emailAddresses?.[0]?.emailAddress,
          priceId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      const stripe = await stripePromise;
      const { error } = await stripe!.redirectToCheckout({
        sessionId: data.sessionId,
      });

      if (error) {
        throw new Error(error.message);
      }
    } catch (error: any) {
      toast.error('Failed to checkout', {
        description: error.message,
      });
    }
  };

  // Define the pricing plans
  const plans = [
    {
      title: 'Hobby',
      description: 'Perfect for personal projects and learning.',
      monthlyPrice: 0,
      yearlyPrice: 0,
      features: ['1 Project', 'Basic Support', '500MB Storage', 'Community Access'],
      btnText: 'Get Started',
      popular: false,
      tier: 0,
    },
    {
      title: 'Pro',
      description: 'For professional developers and small teams.',
      monthlyPrice: 19,
      yearlyPrice: 190,
      priceId: 'price_pro', // Replace with actual Stripe price ID
      features: [
        'Unlimited Projects',
        'Priority Support',
        '10GB Storage',
        'API Access',
        'Team Collaboration',
      ],
      btnText: 'Get Pro',
      popular: true,
      tier: 1,
    },
    {
      title: 'Enterprise',
      description: 'For large teams with advanced needs.',
      monthlyPrice: 99,
      yearlyPrice: 990,
      features: [
        'Custom Solutions',
        'Dedicated Support',
        'Unlimited Storage',
        'Advanced Security',
        'Custom Integrations',
      ],
      btnText: 'Contact Us',
      popular: false,
      tier: 2,
    },
  ];

  return (
    <div ref={ref} className="w-full pt-8 py-16 bg-black">
      <motion.div
        className="mx-auto w-full max-w-7xl px-4"
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center">
          <motion.h2
            className="text-3xl md:text-4xl font-semibold tracking-tight text-white mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Example pricing
          </motion.h2>
          <motion.p
            className="text-gray-400 max-w-2xl mx-auto mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Add a hook here to encourage users to pay for your product!
          </motion.p>
          
          <PricingSwitch isYearly={isYearly} togglePricingPeriod={togglePricingPeriod} />
          
          <section className="flex flex-col lg:flex-row flex-wrap justify-center gap-8 lg:gap-8 mt-12">
            {plans.map((plan) => (
              <div key={plan.title} className="w-full sm:w-[350px] lg:flex-1">
                <PricingCard
                  title={plan.title}
                  description={plan.description}
                  monthlyPrice={plan.monthlyPrice}
                  yearlyPrice={plan.yearlyPrice}
                  features={plan.features}
                  priceId={plan.priceId}
                  btnText={plan.btnText}
                  popular={plan.popular}
                  isYearly={isYearly}
                  user={user}
                  handleCheckout={handleCheckout}
                  tier={plan.tier}
                />
              </div>
            ))}
          </section>
        </div>
      </motion.div>
    </div>
  );
}
