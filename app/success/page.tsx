import { Button } from '@/components/ui/button';
import NavBar from '@/components/wrapper/navbar';
import Link from 'next/link';
import Stripe from 'stripe';

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

type Params = Promise<{ slug: string }>;
type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

interface PageProps {
  params: Params;
  searchParams: SearchParams;
}

export default async function SuccessPage({ params, searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  const session = await stripe.checkout.sessions.retrieve(resolvedParams?.session_id as string);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="flex flex-col items-center text-center">
        <h1 className="scroll-m-20 text-5xl font-semibold tracking-tight transition-colors mb-6">
          Welcome to Titan 🎉
        </h1>
        <p className="leading-7 text-center max-w-md mb-8">Let&apos;s get cooking</p>
        <Link href="/dashboard">
          <Button size="lg">Access Dashboard</Button>
        </Link>
      </div>
    </main>
  );
}
