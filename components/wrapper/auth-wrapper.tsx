'use client';

import { ReactNode } from 'react';
import { ClerkProvider } from '@clerk/nextjs';
import { dark } from '@clerk/themes';
import config from '@/config';

interface AuthWrapperProps {
  children: ReactNode;
}

// This is a client component that wraps the ClerkProvider
// No need for headers() here as it's not a server component accessing Clerk APIs directly
const AuthWrapper = ({ children }: AuthWrapperProps) => {
  if (!config.auth.enabled) {
    return <>{children}</>;
  }

  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
        elements: {
          formButtonPrimary: 'bg-green-600 hover:bg-green-700',
          footerActionLink: 'text-green-600 hover:text-green-700',
        },
      }}
    >
      {children}
    </ClerkProvider>
  );
};

export default AuthWrapper;
