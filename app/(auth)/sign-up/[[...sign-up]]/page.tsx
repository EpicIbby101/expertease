'use client';
import config from '@/config';
import { SignUp } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { dark } from '@clerk/themes';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function SignUpPage() {
  const router = useRouter();

  // If auth is disabled, show a message rather than redirecting
  if (!config?.auth?.enabled) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-4">
        <h2 className="text-2xl font-bold mb-4">Authentication Disabled</h2>
        <p className="text-center text-gray-500 mb-6">
          Authentication is currently disabled in this environment.
        </p>
        <Button asChild variant="outline">
          <Link href="/">Return to Home</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex min-w-screen justify-center my-[5rem]">
      <SignUp appearance={{ baseTheme: dark }} />
    </div>
  );
}
