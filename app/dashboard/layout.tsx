import { ReactNode } from 'react';
import DashboardTopNav from './_components/dashbord-top-nav';

// We're avoiding any headers/cookies interaction completely to prevent the error

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  try {
    // The middleware will handle auth/redirects, so we don't need to do anything here
    // Since this is a protected route, if we got here, the user is authenticated
    
    return (
      <div className="min-h-screen w-full bg-background">
        <DashboardTopNav>
          <main className="mx-auto max-w-7xl w-full p-4 sm:p-6 lg:p-8">{children}</main>
        </DashboardTopNav>
      </div>
    );
  } catch (error) {
    console.error("Error in dashboard layout:", error);
    
    return (
      <div className="min-h-screen w-full bg-background">
        <main className="mx-auto max-w-7xl w-full p-4 sm:p-6 lg:p-8">
          <h1>Something went wrong</h1>
        </main>
      </div>
    );
  }
}
