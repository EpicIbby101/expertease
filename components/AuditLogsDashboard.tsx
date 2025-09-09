'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  Filter, 
  Download, 
  Trash2, 
  Eye, 
  Calendar,
  User,
  Shield,
  AlertTriangle,
  Info,
  AlertCircle,
  XCircle
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface AuditLog {
  id: string;
  user_id?: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  metadata?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  severity: 'low' | 'info' | 'warning' | 'error' | 'critical';
  category: string;
  created_at: string;
  users?: {
    first_name?: string;
    last_name?: string;
    email: string;
  };
}

interface AuditLogsDashboardProps {
  initialLogs?: AuditLog[];
  totalCount?: number;
}

export function AuditLogsDashboard({ initialLogs = [], totalCount = 0 }: AuditLogsDashboardProps) {
  const [logs, setLogs] = useState<AuditLog[]>(initialLogs);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(totalCount);
  const [filters, setFilters] = useState({
    search: '',
    action: '',
    resource_type: '',
    category: '',
    severity: '',
    user_id: '',
    start_date: '',
    end_date: ''
  });

  const [showFilters, setShowFilters] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  // Fetch logs with current filters
  const fetchLogs = async (pageNum: number = 1, newFilters = filters) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: '50',
        ...Object.fromEntries(Object.entries(newFilters).filter(([_, v]) => v))
      });

      const response = await fetch(`/api/admin/audit-logs?${params}`);
      const data = await response.json();

      if (response.ok) {
        setLogs(data.audit_logs);
        setTotal(data.pagination.total);
        setPage(pageNum);
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  // Apply filters
  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    fetchLogs(1, newFilters);
  };

  // Clear filters
  const clearFilters = () => {
    const emptyFilters = {
      search: '',
      action: '',
      resource_type: '',
      category: '',
      severity: '',
      user_id: '',
      start_date: '',
      end_date: ''
    };
    setFilters(emptyFilters);
    fetchLogs(1, emptyFilters);
  };

  // Export logs
  const exportLogs = async () => {
    try {
      const params = new URLSearchParams({
        limit: '1000', // Export more records
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v))
      });

      const response = await fetch(`/api/admin/audit-logs?${params}`);
      const data = await response.json();

      if (response.ok) {
        const csv = convertToCSV(data.audit_logs);
        downloadCSV(csv, `audit-logs-${new Date().toISOString().split('T')[0]}.csv`);
      }
    } catch (error) {
      console.error('Error exporting logs:', error);
    }
  };

  // Convert logs to CSV
  const convertToCSV = (logs: AuditLog[]) => {
    const headers = ['Date', 'User', 'Action', 'Resource Type', 'Resource ID', 'Severity', 'Category', 'IP Address'];
    const rows = logs.map(log => [
      new Date(log.created_at).toISOString(),
      log.users ? `${log.users.first_name || ''} ${log.users.last_name || ''}`.trim() || log.users.email : 'System',
      log.action,
      log.resource_type,
      log.resource_id || '',
      log.severity,
      log.category,
      log.ip_address || ''
    ]);

    return [headers, ...rows].map(row => row.map(field => `"${field}"`).join(',')).join('\n');
  };

  // Download CSV
  const downloadCSV = (csv: string, filename: string) => {
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Get severity icon and color
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info': return <Info className="h-4 w-4 text-blue-500" />;
      case 'low': return <Info className="h-4 w-4 text-gray-500" />;
      default: return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'error': return 'bg-red-100 text-red-700';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'info': return 'bg-blue-100 text-blue-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Audit Logs</h2>
          <p className="text-gray-600">Track all administrative actions and system events</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowFilters(!showFilters)} variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          <Button onClick={exportLogs} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filter Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="search">Search</Label>
                <Input
                  id="search"
                  placeholder="Search actions..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="action">Action</Label>
                <Select value={filters.action} onValueChange={(value) => handleFilterChange('action', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All actions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All actions</SelectItem>
                    <SelectItem value="user_created">User Created</SelectItem>
                    <SelectItem value="user_updated">User Updated</SelectItem>
                    <SelectItem value="user_deleted">User Deleted</SelectItem>
                    <SelectItem value="company_created">Company Created</SelectItem>
                    <SelectItem value="company_deleted">Company Deleted</SelectItem>
                    <SelectItem value="invitation_sent">Invitation Sent</SelectItem>
                    <SelectItem value="login_failed">Login Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="severity">Severity</Label>
                <Select value={filters.severity} onValueChange={(value) => handleFilterChange('severity', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All severities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All severities</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={filters.category} onValueChange={(value) => handleFilterChange('category', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All categories</SelectItem>
                    <SelectItem value="user_management">User Management</SelectItem>
                    <SelectItem value="company_management">Company Management</SelectItem>
                    <SelectItem value="invitation_management">Invitation Management</SelectItem>
                    <SelectItem value="security_event">Security Event</SelectItem>
                    <SelectItem value="system_configuration">System Configuration</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <Button onClick={clearFilters} variant="outline">
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Logs</CardTitle>
            <Shield className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Events</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {logs.filter(log => log.severity === 'critical').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Events</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {logs.filter(log => log.category === 'security_event').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last 24h</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {logs.filter(log => {
                const logDate = new Date(log.created_at);
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                return logDate > yesterday;
              }).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest administrative actions and system events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : logs.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No audit logs found</div>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedLog(log)}
                >
                  <div className="flex items-center gap-4">
                    {getSeverityIcon(log.severity)}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{log.action.replace(/_/g, ' ')}</span>
                        <Badge className={getSeverityColor(log.severity)}>
                          {log.severity}
                        </Badge>
                        <Badge variant="outline">{log.category}</Badge>
                      </div>
                      <div className="text-sm text-gray-500">
                        {log.users ? (
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {log.users.first_name && log.users.last_name 
                              ? `${log.users.first_name} ${log.users.last_name}`
                              : log.users.email
                            }
                          </span>
                        ) : (
                          <span>System</span>
                        )}
                        <span className="mx-2">•</span>
                        <span>{log.resource_type}</span>
                        {log.resource_id && (
                          <>
                            <span className="mx-2">•</span>
                            <span className="font-mono text-xs">{log.resource_id.slice(0, 8)}...</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    <div>{formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}</div>
                    {log.ip_address && (
                      <div className="text-xs">{log.ip_address}</div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {total > 50 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-500">
                Showing {((page - 1) * 50) + 1} to {Math.min(page * 50, total)} of {total} logs
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => fetchLogs(page - 1)}
                  disabled={page === 1 || loading}
                  variant="outline"
                  size="sm"
                >
                  Previous
                </Button>
                <Button
                  onClick={() => fetchLogs(page + 1)}
                  disabled={page * 50 >= total || loading}
                  variant="outline"
                  size="sm"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Log Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">Audit Log Details</h3>
                <Button onClick={() => setSelectedLog(null)} variant="outline" size="sm">
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Action</Label>
                    <p className="text-sm text-gray-600">{selectedLog.action}</p>
                  </div>
                  <div>
                    <Label>Severity</Label>
                    <Badge className={getSeverityColor(selectedLog.severity)}>
                      {selectedLog.severity}
                    </Badge>
                  </div>
                  <div>
                    <Label>Resource Type</Label>
                    <p className="text-sm text-gray-600">{selectedLog.resource_type}</p>
                  </div>
                  <div>
                    <Label>Category</Label>
                    <p className="text-sm text-gray-600">{selectedLog.category}</p>
                  </div>
                  <div>
                    <Label>User</Label>
                    <p className="text-sm text-gray-600">
                      {selectedLog.users ? (
                        selectedLog.users.first_name && selectedLog.users.last_name 
                          ? `${selectedLog.users.first_name} ${selectedLog.users.last_name} (${selectedLog.users.email})`
                          : selectedLog.users.email
                      ) : 'System'
                      }
                    </p>
                  </div>
                  <div>
                    <Label>Date</Label>
                    <p className="text-sm text-gray-600">
                      {new Date(selectedLog.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>

                {selectedLog.old_values && (
                  <div>
                    <Label>Previous Values</Label>
                    <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                      {JSON.stringify(selectedLog.old_values, null, 2)}
                    </pre>
                  </div>
                )}

                {selectedLog.new_values && (
                  <div>
                    <Label>New Values</Label>
                    <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                      {JSON.stringify(selectedLog.new_values, null, 2)}
                    </pre>
                  </div>
                )}

                {selectedLog.metadata && (
                  <div>
                    <Label>Metadata</Label>
                    <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                      {JSON.stringify(selectedLog.metadata, null, 2)}
                    </pre>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  {selectedLog.ip_address && (
                    <div>
                      <Label>IP Address</Label>
                      <p className="text-sm text-gray-600">{selectedLog.ip_address}</p>
                    </div>
                  )}
                  {selectedLog.user_agent && (
                    <div>
                      <Label>User Agent</Label>
                      <p className="text-sm text-gray-600 break-all">{selectedLog.user_agent}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
