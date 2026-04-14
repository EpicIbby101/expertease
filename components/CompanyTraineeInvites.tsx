'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Mail,
  Clock,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Search,
  Ban,
  Send,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

type InviteUserData = {
  first_name?: string | null;
  last_name?: string | null;
};

export type CompanyTraineeInviteRow = {
  id: string;
  email: string;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  expires_at: string;
  accepted_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  user_data: InviteUserData | null;
};

type Counts = {
  total: number;
  pending: number;
  accepted: number;
  expired: number;
  cancelled: number;
};

type StatusTab = 'all' | 'pending' | 'accepted' | 'expired' | 'cancelled';

interface CompanyTraineeInvitesProps {
  companyId: string;
  refreshTrigger?: number;
}

function statusBadge(status: string) {
  switch (status) {
    case 'pending':
      return (
        <Badge variant="outline" className="text-xs border-yellow-200 bg-yellow-50 text-yellow-900">
          Pending
        </Badge>
      );
    case 'accepted':
      return (
        <Badge variant="outline" className="text-xs border-green-200 bg-green-50 text-green-900">
          Accepted
        </Badge>
      );
    case 'expired':
      return (
        <Badge variant="outline" className="text-xs border-red-200 bg-red-50 text-red-900">
          Expired
        </Badge>
      );
    case 'cancelled':
      return (
        <Badge variant="outline" className="text-xs border-gray-200 bg-gray-50 text-gray-800">
          Cancelled
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="text-xs">
          {status}
        </Badge>
      );
  }
}

export function CompanyTraineeInvites({ companyId, refreshTrigger = 0 }: CompanyTraineeInvitesProps) {
  const [invitations, setInvitations] = useState<CompanyTraineeInviteRow[]>([]);
  const [counts, setCounts] = useState<Counts>({
    total: 0,
    pending: 0,
    accepted: 0,
    expired: 0,
    cancelled: 0,
  });
  const [statusTab, setStatusTab] = useState<StatusTab>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionKey, setActionKey] = useState<string | null>(null);

  const fetchInvitations = useCallback(async () => {
    if (!companyId) {
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(`/api/company/invitations?status=${encodeURIComponent(statusTab)}`);
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to load invitations');
        setInvitations([]);
        return;
      }
      setInvitations(data.invitations || []);
      if (data.counts && typeof data.counts === 'object') {
        setCounts({
          total: Number(data.counts.total) || 0,
          pending: Number(data.counts.pending) || 0,
          accepted: Number(data.counts.accepted) || 0,
          expired: Number(data.counts.expired) || 0,
          cancelled: Number(data.counts.cancelled) || 0,
        });
      }
    } catch {
      toast.error('Failed to load invitations');
      setInvitations([]);
    } finally {
      setLoading(false);
    }
  }, [companyId, statusTab]);

  useEffect(() => {
    fetchInvitations();
  }, [fetchInvitations, refreshTrigger]);

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) {
      return invitations;
    }
    return invitations.filter((row) => {
      const name = [row.user_data?.first_name, row.user_data?.last_name]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return row.email.toLowerCase().includes(q) || name.includes(q);
    });
  }, [invitations, searchTerm]);

  const displayName = (row: CompanyTraineeInviteRow) => {
    const u = row.user_data;
    const n = [u?.first_name, u?.last_name].filter(Boolean).join(' ').trim();
    return n || '—';
  };

  const runCancel = async (invitationId: string) => {
    if (!confirm('Cancel this invitation? They will not be able to use the current signup link.')) {
      return;
    }
    setActionKey(`cancel:${invitationId}`);
    try {
      const res = await fetch('/api/company/cancel-invitation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invitationId }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to cancel');
      }
      toast.success(data.message || 'Invitation cancelled');
      await fetchInvitations();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to cancel');
    } finally {
      setActionKey(null);
    }
  };

  const runResend = async (invitationId: string) => {
    setActionKey(`resend:${invitationId}`);
    try {
      const res = await fetch('/api/company/resend-invitation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invitationId }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.details || data.error || 'Failed to resend');
      }
      toast.success(data.message || 'Invitation resent');
      await fetchInvitations();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to resend');
    } finally {
      setActionKey(null);
    }
  };

  if (!companyId) {
    return null;
  }

  const pendingAccent = counts.pending > 0;

  return (
    <Card
      className={`border-l-4 ${pendingAccent ? 'border-l-orange-500' : 'border-l-green-500'} transition-shadow`}
    >
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between space-y-0 pb-2">
        <div className="min-w-0">
          <CardTitle className="flex items-center gap-2 text-lg">
            {pendingAccent ? (
              <Clock className="h-5 w-5 shrink-0 text-orange-600" />
            ) : (
              <CheckCircle className="h-5 w-5 shrink-0 text-green-600" />
            )}
            Trainee invitations
          </CardTitle>
          <CardDescription>
            Pending: {counts.pending} · Accepted: {counts.accepted} · Expired: {counts.expired} · Cancelled:{' '}
            {counts.cancelled}
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={fetchInvitations} disabled={loading} className="shrink-0 gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={statusTab} onValueChange={(v) => setStatusTab(v as StatusTab)} className="w-full">
          <TabsList className="flex h-auto min-h-10 w-full flex-wrap justify-start gap-1 bg-muted/50 p-1">
            <TabsTrigger value="all" className="text-xs sm:text-sm">
              All ({counts.total})
            </TabsTrigger>
            <TabsTrigger value="pending" className="text-xs sm:text-sm">
              Pending ({counts.pending})
            </TabsTrigger>
            <TabsTrigger value="accepted" className="text-xs sm:text-sm">
              Accepted ({counts.accepted})
            </TabsTrigger>
            <TabsTrigger value="expired" className="text-xs sm:text-sm">
              Expired ({counts.expired})
            </TabsTrigger>
            <TabsTrigger value="cancelled" className="text-xs sm:text-sm">
              Cancelled ({counts.cancelled})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Filter by email or name…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        {loading ? (
          <div className="flex items-center gap-2 py-6 text-sm text-gray-600">
            <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
            Loading invitations…
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50/80 py-8 text-center text-sm text-gray-600">
            {searchTerm.trim()
              ? 'No invitations match your search.'
              : statusTab === 'pending'
                ? 'No pending invites. Invite a trainee to see them here.'
                : `No ${statusTab} invitations.`}
          </div>
        ) : (
          <div className="space-y-2">
            {statusTab === 'pending' && counts.pending > 0 && (
              <div className="flex items-start gap-2 rounded-md border border-orange-100 bg-orange-50 px-3 py-2 text-sm text-orange-800">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-orange-600" />
                <span>
                  Pending rows can be <strong>resent</strong> (new Clerk email + link) or <strong>cancelled</strong>{' '}
                  (revokes Clerk + marks cancelled).
                </span>
              </div>
            )}
            <ul className="divide-y rounded-lg border bg-white">
              {filtered.map((row) => {
                const exp = new Date(row.expires_at);
                const expiringSoon = row.status === 'pending' && exp.getTime() - Date.now() < 48 * 60 * 60 * 1000;
                const busyCancel = actionKey === `cancel:${row.id}`;
                const busyResend = actionKey === `resend:${row.id}`;

                return (
                  <li
                    key={row.id}
                    className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Mail className="h-4 w-4 shrink-0 text-gray-400" />
                        <span className="truncate font-medium text-gray-900">{row.email}</span>
                        {statusBadge(row.status)}
                        {expiringSoon ? (
                          <Badge
                            variant="outline"
                            className="text-xs border-amber-300 bg-amber-50 text-amber-900"
                          >
                            Expires soon
                          </Badge>
                        ) : null}
                      </div>
                      <p className="mt-1 truncate text-sm text-gray-600">
                        {displayName(row)}
                        {row.created_at ? (
                          <span className="text-gray-400">
                            {' '}
                            · Sent {formatDistanceToNow(new Date(row.created_at), { addSuffix: true })}
                          </span>
                        ) : null}
                        {row.status === 'accepted' && row.accepted_at ? (
                          <span className="text-gray-400">
                            {' '}
                            · Joined {formatDistanceToNow(new Date(row.accepted_at), { addSuffix: true })}
                          </span>
                        ) : null}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:gap-3">
                      <div className="text-sm text-gray-600 sm:text-right">
                        {row.status === 'pending' ? (
                          <>
                            <div>Expires {format(exp, 'MMM d, yyyy')}</div>
                            <div className="text-xs text-gray-400">{format(exp, 'p')}</div>
                          </>
                        ) : row.status === 'accepted' && row.accepted_at ? (
                          <>
                            <div>Accepted {format(new Date(row.accepted_at), 'MMM d, yyyy')}</div>
                            <div className="text-xs text-gray-400">{format(new Date(row.accepted_at), 'p')}</div>
                          </>
                        ) : (
                          <>
                            <div className="text-xs text-gray-500">Updated {row.updated_at ? formatDistanceToNow(new Date(row.updated_at), { addSuffix: true }) : '—'}</div>
                          </>
                        )}
                      </div>
                      {row.status === 'pending' ? (
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="gap-1"
                            disabled={busyResend || busyCancel}
                            onClick={() => runResend(row.id)}
                          >
                            <Send className={`h-3.5 w-3.5 ${busyResend ? 'animate-pulse' : ''}`} />
                            {busyResend ? 'Sending…' : 'Resend'}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="gap-1 text-red-700 hover:bg-red-50"
                            disabled={busyResend || busyCancel}
                            onClick={() => runCancel(row.id)}
                          >
                            <Ban className={`h-3.5 w-3.5 ${busyCancel ? 'animate-pulse' : ''}`} />
                            {busyCancel ? '…' : 'Cancel'}
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
