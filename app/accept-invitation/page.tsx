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
  const [step, setStep] = useState<'loading' | 'verifying' | 'signup' | 'profile' | 'done' | 'error'>('loading');
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
          setStep("error");
          return;
        }

        // If user is signed in, check if they have a complete profile first
        if (isSignedIn && user) {
          try {
            // Check if user profile is already complete in Supabase
            const userResponse = await fetch('/api/check-role');
            const userData = await userResponse.json();
            
            if (userData.hasAccess && userData.role) {
              // User already has a complete profile, redirect to dashboard
              console.log('User profile complete, redirecting to dashboard');
              router.push('/dashboard');
              return;
            }
          } catch (err) {
            console.error('Error checking user role:', err);
          }
        }

        // First, verify the invitation token
        setStep("verifying");
        const response = await fetch(`/api/invitations/verify?token=${token}`);
        const data = await response.json();
        
        if (!response.ok) {
          setError(data.error || "Invalid or expired invitation");
          setStep("error");
          return;
        }

        // Store invitation data for later use
        setInvitationData(data.invitation);
        
        // If user is signed in, show profile form
        if (isSignedIn && user) {
          setStep("profile");
          return;
        }

        // If not signed in, show signup step
        setStep("signup");
      } catch (err) {
        console.error('Error checking invitation status:', err);
        setError("Failed to load invitation data");
        setStep("error");
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

      // Store invitation data in localStorage for Clerk signup to access
      localStorage.setItem('invitationData', JSON.stringify({
        token,
        email: invitationData.email,
        first_name: invitationData.user_data?.first_name || "",
        last_name: invitationData.user_data?.last_name || "",
        role: invitationData.role,
        company_id: invitationData.company_id,
        user_data: invitationData.user_data
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
      
      // Clear invitation data from localStorage
      localStorage.removeItem('invitationData');
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
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
          <div className="text-gray-600">Loading invitation...</div>
        </div>
      </div>
    );
  }

  if (step === "verifying") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <div className="text-gray-600">Verifying invitation...</div>
        </div>
      </div>
    );
  }

  if (step === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Invalid Invitation</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button onClick={() => router.push("/")} className="w-full mt-4">Go to Home</Button>
          </CardContent>
        </Card>
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
            <CardDescription>Your account has been created successfully. Redirecting to dashboard...</CardDescription>
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
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <AcceptInvitationContent />
    </Suspense>
  );
} 