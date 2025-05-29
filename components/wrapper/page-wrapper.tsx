'use client';
import NavBar from './navbar';
import { Footer } from './footer';

// Simple page wrapper that doesn't use any server components or headers
export default function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-hidden w-full">
      <NavBar />
      <main className="flex min-h-screen flex-col items-center bg-black justify-between w-full overflow-hidden">
        {children}
      </main>
      <Footer />
    </div>
  );
}
