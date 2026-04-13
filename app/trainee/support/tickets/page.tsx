'use client';

import { useState, useEffect } from 'react';
import { RoleGate } from '../../../../components/RoleGate';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { 
  HelpCircle, 
  ArrowLeft, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  MessageSquare,
  Calendar,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

interface Ticket {
  id: string;
  ticket_number: string;
  category: string;
  priority: string;
  subject: string;
  message: string;
  status: string;
  admin_response?: string;
  admin_response_at?: string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
}

export default function TicketHistoryPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTickets = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/trainee/tickets');
      if (!response.ok) {
        throw new Error('Failed to fetch tickets');
      }
      const data = await response.json();
      setTickets(data.tickets || []);
    } catch (err) {
      console.error('Error fetching tickets:', err);
      setError('Failed to load tickets. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', className: string, icon: any }> = {
      open: { variant: 'default', className: 'bg-blue-100 text-blue-700 border-blue-200', icon: Clock },
      in_progress: { variant: 'default', className: 'bg-orange-100 text-orange-700 border-orange-200', icon: AlertCircle },
      resolved: { variant: 'default', className: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle },
      closed: { variant: 'secondary', className: 'bg-gray-100 text-gray-700 border-gray-200', icon: XCircle },
    };
    const config = variants[status] || variants.open;
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className={config.className}>
        <Icon className="h-3 w-3 mr-1" />
        {status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, { className: string }> = {
      low: { className: 'bg-blue-50 text-blue-700 border-blue-200' },
      medium: { className: 'bg-orange-50 text-orange-700 border-orange-200' },
      high: { className: 'bg-red-50 text-red-700 border-red-200' },
    };
    const config = variants[priority] || variants.medium;
    return (
      <Badge variant="outline" className={config.className}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </Badge>
    );
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      course: '📚 Course Question',
      technical: '🐛 Technical Issue',
      account: '⚙️ Account Help',
      access: '🔐 Access Request',
      other: '💬 Other',
    };
    return labels[category] || category;
  };

  return (
    <RoleGate requiredRole="trainee">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/trainee/support">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Support
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Support Tickets</h1>
              <p className="text-gray-600 mt-1">View and track your support requests</p>
            </div>
          </div>
          <Button onClick={fetchTickets} variant="outline" size="sm" disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <Card>
            <CardContent className="py-12 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Loading your tickets...</p>
            </CardContent>
          </Card>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="py-6">
              <div className="flex items-center gap-3 text-red-800">
                <AlertCircle className="h-5 w-5" />
                <p>{error}</p>
                <Button onClick={fetchTickets} variant="outline" size="sm" className="ml-auto">
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tickets List */}
        {!isLoading && !error && (
          <>
            {tickets.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No tickets yet</h3>
                  <p className="text-gray-600 mb-4">You haven't submitted any support tickets yet.</p>
                  <Link href="/trainee/support">
                    <Button>
                      <HelpCircle className="h-4 w-4 mr-2" />
                      Submit a Ticket
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {tickets.map((ticket) => (
                  <Card key={ticket.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <CardTitle className="text-lg">{ticket.subject}</CardTitle>
                            {getStatusBadge(ticket.status)}
                            {getPriorityBadge(ticket.priority)}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <span className="font-medium">#{ticket.ticket_number}</span>
                            </span>
                            <span className="flex items-center gap-1">
                              <span>{getCategoryLabel(ticket.category)}</span>
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              <span>Created {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-1">Your Message:</p>
                          <p className="text-sm text-gray-600 whitespace-pre-wrap">{ticket.message}</p>
                        </div>

                        {ticket.admin_response && (
                          <>
                            <Separator />
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                              <div className="flex items-start gap-3 mb-2">
                                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-green-900 mb-1">Admin Response:</p>
                                  <p className="text-sm text-green-800 whitespace-pre-wrap">{ticket.admin_response}</p>
                                  {ticket.admin_response_at && (
                                    <p className="text-xs text-green-600 mt-2">
                                      Responded {formatDistanceToNow(new Date(ticket.admin_response_at), { addSuffix: true })}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </>
                        )}

                        {ticket.status === 'open' && !ticket.admin_response && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <div className="flex items-center gap-2 text-blue-800 text-sm">
                              <Clock className="h-4 w-4" />
                              <span>Your ticket is open and waiting for admin response.</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </RoleGate>
  );
}

