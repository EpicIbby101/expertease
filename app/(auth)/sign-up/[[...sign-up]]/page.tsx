"use client";

import { useEffect, useState } from "react";
import { SignUp } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export default function SignUpPage() {
  const router = useRouter();
  const [invitationData, setInvitationData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if we have invitation data in localStorage
    const storedData = localStorage.getItem('invitationData');
    if (storedData) {
      try {
        const data = JSON.parse(storedData);
        setInvitationData(data);
        console.log('Found invitation data:', data);
      } catch (err) {
        console.error('Error parsing invitation data:', err);
      }
    }
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading signup form...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-gray-900">
            {invitationData ? 'Complete Your Account Setup' : 'Create Your Account'}
          </h2>
          {invitationData && (
            <p className="mt-2 text-sm text-gray-600">
              Welcome! Your invitation details have been pre-filled.
            </p>
          )}
        </div>
        
        <SignUp 
          appearance={{
            elements: {
              formButtonPrimary: "bg-blue-600 hover:bg-blue-700 text-white",
              card: "shadow-xl",
              rootBox: "mx-auto",
              cardContent: "px-6 py-8",
            }
          }}
          redirectUrl={invitationData ? `/accept-invitation?token=${invitationData.token}` : '/dashboard'}
          initialValues={{
            emailAddress: invitationData?.email || "",
            firstName: invitationData?.first_name || "",
            lastName: invitationData?.last_name || "",
          }}
        />
        
        {invitationData && (
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              You're signing up with an invitation. After creating your password, 
              you'll complete your profile setup.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
