'use client';
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { useUser } from '@clerk/nextjs';
import { User, Phone, Briefcase, Building, MapPin, Globe, Clock, FileText, CheckCircle, AlertCircle } from 'lucide-react';

interface UserProfile {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  job_title?: string;
  department?: string;
  bio?: string;
  location?: string;
  timezone?: string;
  preferred_language?: string;
  profile_completed?: boolean;
  is_active?: boolean;
  role?: string;
  company_name?: string;
}

export default function Settings() {
  const { user } = useUser();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    job_title: '',
    department: '',
    bio: '',
    location: '',
    timezone: '',
    preferred_language: 'en'
  });

  // Fetch user profile on component mount
  useEffect(() => {
    if (user?.id) {
      fetchUserProfile();
    }
  }, [user?.id]);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch(`/api/user/profile`);
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        setFormData({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          phone: data.phone || '',
          job_title: data.job_title || '',
          department: data.department || '',
          bio: data.bio || '',
          location: data.location || '',
          timezone: data.timezone || '',
          preferred_language: data.preferred_language || 'en'
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({
          title: "Profile Updated",
          description: "Your profile has been updated successfully.",
        });
        await fetchUserProfile(); // Refresh profile data
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update profile');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getProfileCompletionPercentage = () => {
    if (!profile) return 0;
    
    const fields = [
      profile.first_name,
      profile.last_name,
      profile.phone,
      profile.job_title,
      profile.department,
      profile.location,
      profile.timezone
    ];
    
    const completedFields = fields.filter(field => field && field.trim() !== '').length;
    return Math.round((completedFields / fields.length) * 100);
  };

  const completionPercentage = getProfileCompletionPercentage();

  return (
    <div className="flex justify-start items-start flex-wrap px-4 pt-5 gap-6">
      <div className="flex flex-col gap-6 mb-[5rem] w-full max-w-[800px]">
        <div className="flex items-center justify-between">
          <div>
        <h2 className="mt-10 scroll-m-20 border-b pb-2 w-full text-3xl font-semibold tracking-tight transition-colors first:mt-0">
          My Profile
        </h2>
            <p className="text-gray-600 mt-2">Manage your account settings and profile information</p>
          </div>
          <div className="flex items-center gap-2">
            {profile?.profile_completed ? (
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Profile Complete
              </Badge>
            ) : (
              <Badge variant="secondary">
                <AlertCircle className="h-3 w-3 mr-1" />
                {completionPercentage}% Complete
              </Badge>
            )}
          </div>
        </div>

        {/* Profile Completion Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Completion
            </CardTitle>
            <CardDescription>
              Complete your profile to get the most out of Expert Ease
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Profile Progress</span>
                <span>{completionPercentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${completionPercentage}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500">
                {completionPercentage < 100 
                  ? "Add more information to complete your profile" 
                  : "Great! Your profile is complete"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
            <CardDescription>Your basic account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Email</Label>
                <Input disabled value={user?.emailAddresses?.[0]?.emailAddress || ''} />
              </div>
              <div>
                <Label>Role</Label>
                <Input disabled value={profile?.role?.replace('_', ' ') || 'Trainee'} />
              </div>
            </div>
            {profile?.company_name && (
              <div>
                <Label>Company</Label>
                <Input disabled value={profile.company_name} />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Profile Form */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Details</CardTitle>
            <CardDescription>Update your personal and professional information</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div>
                <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="first_name">First Name *</Label>
                    <Input
                      id="first_name"
                      value={formData.first_name}
                      onChange={(e) => handleInputChange('first_name', e.target.value)}
                      placeholder="Enter your first name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="last_name">Last Name *</Label>
                    <Input
                      id="last_name"
                      value={formData.last_name}
                      onChange={(e) => handleInputChange('last_name', e.target.value)}
                      placeholder="Enter your last name"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      placeholder="City, Country"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Professional Information */}
              <div>
                <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Professional Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="job_title">Job Title</Label>
                    <Input
                      id="job_title"
                      value={formData.job_title}
                      onChange={(e) => handleInputChange('job_title', e.target.value)}
                      placeholder="e.g., Software Engineer"
                    />
                  </div>
                  <div>
                    <Label htmlFor="department">Department</Label>
                    <Input
                      id="department"
                      value={formData.department}
                      onChange={(e) => handleInputChange('department', e.target.value)}
                      placeholder="e.g., Engineering"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Preferences */}
              <div>
                <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Preferences
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select value={formData.timezone} onValueChange={(value) => handleInputChange('timezone', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select timezone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                        <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                        <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                        <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                        <SelectItem value="Europe/London">London (GMT)</SelectItem>
                        <SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
                        <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                        <SelectItem value="Australia/Sydney">Sydney (AEDT)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="preferred_language">Preferred Language</Label>
                    <Select value={formData.preferred_language} onValueChange={(value) => handleInputChange('preferred_language', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                        <SelectItem value="de">German</SelectItem>
                        <SelectItem value="it">Italian</SelectItem>
                        <SelectItem value="pt">Portuguese</SelectItem>
                        <SelectItem value="ja">Japanese</SelectItem>
                        <SelectItem value="ko">Korean</SelectItem>
                        <SelectItem value="zh">Chinese</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Bio */}
              <div>
                <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  About Me
                </h3>
                <div>
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    placeholder="Tell us about yourself, your experience, and what you're looking to learn..."
                    rows={4}
                  />
          </div>
        </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
