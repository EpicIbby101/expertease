'use client';

import { useEffect, useState } from 'react';
import {
  Mail,
  Calendar,
  Phone,
  Briefcase,
  MapPin,
  ChevronRight,
  ChevronDown,
  Users,
  Zap,
  ArrowRight,
  MessageSquare,
} from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { LoadingButton } from '@/components/ui/loading-button';
import { toast } from 'sonner';

const defaultMessage = (companyName: string) =>
  `Welcome to ${companyName}! You've been invited to join our training program.`;

export type CompanyInviteTraineeModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  companyName: string;
  /** Called after a successful invite (dialog already closed). */
  onSuccess?: () => void;
};

export function CompanyInviteTraineeModal({
  open,
  onOpenChange,
  companyId,
  companyName,
  onSuccess,
}: CompanyInviteTraineeModalProps) {
  const [showOptionalFields, setShowOptionalFields] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [form, setForm] = useState({
    email: '',
    first_name: '',
    last_name: '',
    date_of_birth: '',
    phone: '',
    job_title: '',
    department: '',
    location: '',
    message: defaultMessage(companyName),
  });

  useEffect(() => {
    if (!open) return;
    setShowOptionalFields(false);
    setForm({
      email: '',
      first_name: '',
      last_name: '',
      date_of_birth: '',
      phone: '',
      job_title: '',
      department: '',
      location: '',
      message: defaultMessage(companyName),
    });
  }, [open, companyName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email.trim()) {
      toast.error('Please enter an email address');
      return;
    }
    if (!form.first_name?.trim() || !form.last_name?.trim()) {
      toast.error('First and last name are required');
      return;
    }
    if (form.first_name.trim().length < 2 || form.last_name.trim().length < 2) {
      toast.error('First and last name must be at least 2 characters');
      return;
    }

    setIsInviting(true);
    try {
      const response = await fetch('/api/company/create-trainee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          first_name: form.first_name,
          last_name: form.last_name,
          companyId,
          message: form.message,
          phone: form.phone || undefined,
          job_title: form.job_title || undefined,
          department: form.department || undefined,
          location: form.location || undefined,
          date_of_birth: form.date_of_birth || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Failed to invite trainee');
        return;
      }

      toast.success('Trainee invited successfully!');
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      console.error(err);
      toast.error('An error occurred while inviting trainee');
    } finally {
      setIsInviting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[95vh] w-full max-w-2xl flex-col gap-0 overflow-hidden rounded-xl border-0 bg-white p-0 shadow-2xl sm:max-w-2xl">
        <DialogTitle className="sr-only">Invite new trainee</DialogTitle>

        <div className="flex items-center justify-between border-b bg-gradient-to-r from-blue-50 to-indigo-50 p-6 pr-14">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 p-3 shadow-lg">
              <Mail className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Invite trainee</h2>
              <p className="text-sm text-gray-600">
                Send a personalized invitation to join {companyName}&apos;s training program
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 flex-1 overflow-y-auto p-6">
            <div className="space-y-8">
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                    <span className="text-sm font-semibold text-blue-600">1</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Basic information</h3>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="co-invite-email" className="text-sm font-medium text-gray-700">
                    Email address *
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      id="co-invite-email"
                      type="email"
                      placeholder="john.doe@company.com"
                      value={form.email}
                      onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                      className="pl-10"
                      disabled={isInviting}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="co-invite-first" className="text-sm font-medium text-gray-700">
                      First name *
                    </Label>
                    <Input
                      id="co-invite-first"
                      placeholder="John"
                      value={form.first_name}
                      onChange={(e) => setForm((p) => ({ ...p, first_name: e.target.value }))}
                      disabled={isInviting}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="co-invite-last" className="text-sm font-medium text-gray-700">
                      Last name *
                    </Label>
                    <Input
                      id="co-invite-last"
                      placeholder="Doe"
                      value={form.last_name}
                      onChange={(e) => setForm((p) => ({ ...p, last_name: e.target.value }))}
                      disabled={isInviting}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="co-invite-dob" className="text-sm font-medium text-gray-700">
                    Date of birth
                  </Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      id="co-invite-dob"
                      type="date"
                      value={form.date_of_birth}
                      onChange={(e) => setForm((p) => ({ ...p, date_of_birth: e.target.value }))}
                      className="pl-10"
                      disabled={isInviting}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
                    <span className="text-sm font-semibold text-gray-600">2</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Additional information</h3>
                  <Badge variant="secondary" className="text-xs">
                    Optional
                  </Badge>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowOptionalFields(!showOptionalFields)}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
                  disabled={isInviting}
                >
                  {showOptionalFields ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  {showOptionalFields ? 'Hide' : 'Show'} optional fields
                </Button>

                {showOptionalFields && (
                  <div className="grid grid-cols-1 gap-4 border-t border-gray-200 pt-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="co-invite-phone" className="text-sm font-medium text-gray-700">
                        Phone number
                      </Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <Input
                          id="co-invite-phone"
                          type="tel"
                          placeholder="+1 (555) 123-4567"
                          value={form.phone}
                          onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                          className="pl-10"
                          disabled={isInviting}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="co-invite-job" className="text-sm font-medium text-gray-700">
                        Job title
                      </Label>
                      <div className="relative">
                        <Briefcase className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <Input
                          id="co-invite-job"
                          placeholder="Software engineer"
                          value={form.job_title}
                          onChange={(e) => setForm((p) => ({ ...p, job_title: e.target.value }))}
                          className="pl-10"
                          disabled={isInviting}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="co-invite-dept" className="text-sm font-medium text-gray-700">
                        Department
                      </Label>
                      <Input
                        id="co-invite-dept"
                        placeholder="Engineering"
                        value={form.department}
                        onChange={(e) => setForm((p) => ({ ...p, department: e.target.value }))}
                        disabled={isInviting}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="co-invite-loc" className="text-sm font-medium text-gray-700">
                        Location
                      </Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <Input
                          id="co-invite-loc"
                          placeholder="San Francisco, CA"
                          value={form.location}
                          onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
                          className="pl-10"
                          disabled={isInviting}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                    <span className="text-sm font-semibold text-blue-600">3</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Welcome message</h3>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="co-invite-msg" className="text-sm font-medium text-gray-700">
                    Message shown with their invitation
                  </Label>
                  <div className="relative">
                    <MessageSquare className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Textarea
                      id="co-invite-msg"
                      placeholder="Welcome message..."
                      value={form.message}
                      onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
                      rows={4}
                      className="resize-none pl-10 pt-3"
                      disabled={isInviting}
                    />
                  </div>
                </div>
              </div>

              <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-blue-100 p-2">
                      <Zap className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-blue-900">What happens next?</h4>
                      <ul className="mt-2 space-y-1 text-sm text-blue-800">
                        <li className="flex items-center gap-2">
                          <ArrowRight className="h-3 w-3 shrink-0" />
                          They receive an email to accept and create their account
                        </li>
                        <li className="flex items-center gap-2">
                          <ArrowRight className="h-3 w-3 shrink-0" />
                          Profile is pre-filled with any details you provide
                        </li>
                        <li className="flex items-center gap-2">
                          <ArrowRight className="h-3 w-3 shrink-0" />
                          Invitation expires in 7 days
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="border-t bg-gray-50 p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Users className="h-4 w-4 shrink-0" />
                <span className="break-all">
                  Invitation will be sent to: {form.email.trim() || 'user@example.com'}
                </span>
              </div>
              <div className="flex shrink-0 justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isInviting}
                  className="px-6"
                >
                  Cancel
                </Button>
                <LoadingButton
                  type="submit"
                  loading={isInviting}
                  loadingText="Sending invitation…"
                  disabled={
                    !form.email.trim() ||
                    !form.first_name.trim() ||
                    !form.last_name.trim() ||
                    isInviting
                  }
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 hover:from-blue-700 hover:to-indigo-700"
                >
                  Send invitation
                </LoadingButton>
              </div>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
