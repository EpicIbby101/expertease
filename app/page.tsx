import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { createServerActionClient } from '@/lib/supabase';
import MarketingCards from '@/components/homepage/marketing-cards';
import Pricing from '@/components/homepage/pricing';
import SideBySide from '@/components/homepage/side-by-side';
import PageWrapper from '@/components/wrapper/page-wrapper';
import { WaitlistForm } from '@/lib/components/waitlist-form';
import FloatingCTA from '@/components/homepage/floating-cta';
import FAQ from '@/components/homepage/faq';
import HeroSection from '@/components/homepage/hero-section';
import { SecurityFeatures } from '@/components/homepage/security-features';

export default async function HomePage() {
  const { userId } = await auth();
  
  // If user is authenticated, check their role and redirect
  if (userId) {
    // Get user role from Supabase using Clerk user_id
    const supabase = await createServerActionClient();
    const { data: user, error } = await supabase
      .from('users')
      .select('role, email, first_name, last_name')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching user role:', error);
      // If user doesn't exist in Supabase yet, show setup message
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Welcome!</h1>
            <p className="text-gray-600 mb-4">
              Your account is being set up. Please wait a moment and refresh the page.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <p className="text-sm text-blue-800">
                <strong>User ID:</strong> {userId}
              </p>
              <p className="text-sm text-blue-800 mt-2">
                <strong>Status:</strong> Setting up your account...
              </p>
            </div>
          </div>
        </div>
      );
    }

    // If user has a role, redirect to their dashboard
    if (user?.role) {
      switch (user.role) {
        case 'site_admin':
          redirect('/admin/dashboard');
        case 'company_admin':
          redirect('/company/dashboard');
        case 'trainee':
          redirect('/trainee/dashboard');
      }
    }

    // If no role assigned, show a message
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Welcome!</h1>
          <p className="text-gray-600 mb-4">
            Your account is being set up. Please contact your administrator to assign your role.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <p className="text-sm text-blue-800">
              <strong>User ID:</strong> {userId}
            </p>
            <p className="text-sm text-blue-800">
              <strong>Email:</strong> {user?.email || 'Not found'}
            </p>
            <p className="text-sm text-blue-800">
              <strong>Role:</strong> {user?.role || 'Not assigned'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show marketing page for unauthenticated users
  return (
    <PageWrapper>
      <section id="hero" className="w-full min-h-screen pt-24">
        <HeroSection />
      </section>
      
      <section id="benefits" className="flex py-24 md:py-16 w-full justify-center items-center px-4 sm:px-6">
        <SideBySide />
      </section>
      
      <section id="pricing" className="flex justify-center items-center w-full py-24 md:py-16 min-h-[600px] px-4 sm:px-6">
        <div className="w-full max-w-6xl mx-auto">
          <Pricing />
        </div>
      </section>
      
      <section id="waitlist" className="flex justify-center items-center w-full py-24 md:py-24 min-h-[400px] px-4 sm:px-6">
        <div className="w-full max-w-2xl mx-auto">
          <WaitlistForm />
        </div>
      </section>
      
      <section id="faq" className="flex justify-center items-center w-full py-24 md:py-24 px-4 sm:px-6">
        <FAQ />
      </section>
    </PageWrapper>
  );
}
