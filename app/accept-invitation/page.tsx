"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useUser, useAuth, useClerk } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

function AcceptInvitationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useUser();
  const { isSignedIn } = useAuth();
  const { openSignIn } = useClerk();
  const [step, setStep] = useState<'loading' | 'signup' | 'profile' | 'done'>('loading');
  const [invitationData, setInvitationData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [profile, setProfile] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    job_title: "",
    department: "",
    location: "",
    date_of_birth: "",
  });

  useEffect(() => {
    const checkInvitationStatus = async () => {
      try {
        const token = searchParams.get('token');
        
        if (!token) {
          setError("Invalid invitation link. Missing token.");
          setStep("loading");
          return;
        }

        // If user is signed in, check if they have a complete profile
        if (isSignedIn && user) {
          // Check if user exists in Supabase and has a complete profile
          const response = await fetch(`/api/invitations/validate?token=${token}`);
          const data = await response.json();
          
          if (response.ok && data.invitation) {
            // Set invitation data from Supabase
            setInvitationData({
              email: data.invitation.email,
              role: data.invitation.role,
              company_id: data.invitation.company_id,
              first_name: data.invitation.user_data?.first_name || "",
              last_name: data.invitation.user_data?.last_name || "",
              phone: data.invitation.user_data?.phone || "",
              job_title: data.invitation.user_data?.job_title || "",
              department: data.invitation.user_data?.department || "",
              location: data.invitation.user_data?.location || "",
              date_of_birth: data.invitation.user_data?.date_of_birth || "",
            });
            
            setProfile({
              first_name: data.invitation.user_data?.first_name || "",
              last_name: data.invitation.user_data?.last_name || "",
              phone: data.invitation.user_data?.phone || "",
              job_title: data.invitation.user_data?.job_title || "",
              department: data.invitation.user_data?.department || "",
              location: data.invitation.user_data?.location || "",
              date_of_birth: data.invitation.user_data?.date_of_birth || "",
            });
            
            // Check if user profile is already complete in Supabase
            const userResponse = await fetch('/api/check-role');
            const userData = await userResponse.json();
            
            if (userData.hasAccess && userData.role) {
              // User already has a complete profile, redirect to dashboard
              router.push('/dashboard');
              return;
            }
            
            // User exists but profile incomplete, show profile form
            setStep("profile");
            return;
          } else {
            setError("Invalid or expired invitation. Please contact your administrator.");
            setStep("loading");
            return;
          }
        }

        // If not signed in, show signup step
        setStep("signup");
      } catch (err) {
        console.error('Error checking invitation status:', err);
        setError("Failed to load invitation data");
        setStep("loading");
      }
    };

    checkInvitationStatus();
  }, [isSignedIn, user, searchParams, router]);

  const handleSignUp = async () => {
    try {
      const token = searchParams.get('token');
      if (!token) {
        setError("Invalid invitation token");
        return;
      }

      // Get invitation data to pre-fill the signup form
      const response = await fetch(`/api/invitations/validate?token=${token}`);
      const data = await response.json();
      
      if (!response.ok || !data.invitation) {
        setError("Failed to load invitation data");
        return;
      }

      // Store invitation data in localStorage for Clerk signup to access
      localStorage.setItem('invitationData', JSON.stringify({
        token,
        email: data.invitation.email,
        first_name: data.invitation.user_data?.first_name || "",
        last_name: data.invitation.user_data?.last_name || "",
        role: data.invitation.role,
        company_id: data.invitation.company_id,
        user_data: data.invitation.user_data
      }));

      // Redirect to Clerk signup with pre-filled data
      const signupUrl = `${process.env.NEXT_PUBLIC_APP_URL}/sign-up?redirect_url=${encodeURIComponent(window.location.href)}`;
      window.location.href = signupUrl;
    } catch (err) {
      console.error('Error preparing signup:', err);
      setError("Failed to prepare signup form");
    }
  };

  async function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    // Validate required fields
    if (!profile.first_name || !profile.last_name || !profile.date_of_birth) {
      setError("First name, last name, and date of birth are required.");
      return;
    }
    
    setIsProcessing(true);
    setError(null);
    try {
      if (!user) {
        setError("User not authenticated. Please refresh and try again.");
        return;
      }

      // Update Clerk profile with basic info
      await user.update({
        firstName: profile.first_name,
        lastName: profile.last_name,
      });

      // Create user in Supabase and mark invitation as accepted
      const response = await fetch("/api/invitations/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: invitationData.email,
          role: invitationData.role,
          company_id: invitationData.company_id,
          ...profile,
        }),
        credentials: "include",
      });

      const data = await response.json();
      if (!response.ok) {
        console.error('API Error:', data);
        throw new Error(data.error || "Failed to complete onboarding");
      }
      
      setStep("done");
      toast.success("Account setup complete!");
      router.push("/dashboard");
    } catch (err: any) {
      console.error('Profile submission error:', err);
      setError(err.message || "Failed to complete profile");
    } finally {
      setIsProcessing(false);
    }
  }

  if (step === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading invitation...</p>
          {error && (
            <Card className="w-full max-w-md mt-6">
              <CardHeader>
                <CardTitle className="text-red-600">Error</CardTitle>
              </CardHeader>
              <CardContent>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
                <Button onClick={() => router.push("/")} className="w-full mt-4">Go to Home</Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  if (step === "signup") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>Welcome!</CardTitle>
            <CardDescription>You've been invited to join our platform. Please create your account to continue.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleSignUp} className="w-full">
              Create Account
            </Button>
            <p className="text-sm text-gray-500 mt-4">
              You'll be redirected to create your account and set a password. Your name and email will be pre-filled.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invitationData) return null;

  if (step === "profile") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Complete Your Profile</CardTitle>
            <CardDescription>Fill out your details to finish onboarding.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <Input type="text" placeholder="First Name" value={profile.first_name} onChange={e => setProfile(p => ({ ...p, first_name: e.target.value }))} required />
              <Input type="text" placeholder="Last Name" value={profile.last_name} onChange={e => setProfile(p => ({ ...p, last_name: e.target.value }))} required />
              <Input type="date" placeholder="Date of Birth" value={profile.date_of_birth} onChange={e => setProfile(p => ({ ...p, date_of_birth: e.target.value }))} required />
              <Input type="tel" placeholder="Phone" value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} />
              <Input type="text" placeholder="Job Title" value={profile.job_title} onChange={e => setProfile(p => ({ ...p, job_title: e.target.value }))} />
              <Input type="text" placeholder="Department" value={profile.department} onChange={e => setProfile(p => ({ ...p, department: e.target.value }))} />
              <Input type="text" placeholder="Location" value={profile.location} onChange={e => setProfile(p => ({ ...p, location: e.target.value }))} />
              <Button type="submit" disabled={isProcessing} className="w-full">
                {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Complete Setup
              </Button>
              {error && <Alert className="mt-2"><AlertDescription>{error}</AlertDescription></Alert>}
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === "done") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <CardTitle>Welcome!</CardTitle>
            <CardDescription>Your account has been created. Redirecting...</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return null;
}

export default function AcceptInvitationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <div className="text-gray-600">Loading...</div>
        </div>
      </div>
    }>
      <AcceptInvitationContent />
    </Suspense>
  );
} 