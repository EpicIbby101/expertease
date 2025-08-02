"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useUser, useAuth } from "@clerk/nextjs";
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
  const [step, setStep] = useState<'loading' | 'profile' | 'done'>('loading');
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
  });

  useEffect(() => {
    const checkInvitationStatus = async () => {
      try {
        // If user is signed in, check if they have invitation metadata
        if (isSignedIn && user) {
          const metadata = user.publicMetadata;
          if (metadata.role) {
            // User has invitation metadata, show profile form
            setInvitationData({
              email: user.emailAddresses[0]?.emailAddress,
              role: metadata.role as string,
              company_id: metadata.company_id as string,
              first_name: (metadata.first_name as string) || "",
              last_name: (metadata.last_name as string) || "",
              phone: (metadata.phone as string) || "",
              job_title: (metadata.job_title as string) || "",
              department: (metadata.department as string) || "",
              location: (metadata.location as string) || "",
            });
            setProfile({
              first_name: (metadata.first_name as string) || "",
              last_name: (metadata.last_name as string) || "",
              phone: (metadata.phone as string) || "",
              job_title: (metadata.job_title as string) || "",
              department: (metadata.department as string) || "",
              location: (metadata.location as string) || "",
            });
            setStep("profile");
            return;
          } else {
            // User is signed in but has no invitation metadata
            setError("No invitation data found. Please check your invitation link.");
            setStep("loading");
            return;
          }
        }

        // If not signed in, redirect to Clerk signup
        // Clerk will handle the invitation flow automatically
        router.push("/sign-up");
      } catch (err) {
        setError("Failed to load invitation data");
        setStep("loading");
      }
    };

    checkInvitationStatus();
  }, [isSignedIn, user, router]);

  async function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault();
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
      if (!response.ok) throw new Error(data.error || "Failed to complete onboarding");
      
      setStep("done");
      toast.success("Account setup complete!");
      router.push("/dashboard");
    } catch (err: any) {
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
              <Input type="text" placeholder="Phone" value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} />
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
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <AcceptInvitationContent />
    </Suspense>
  );
} 