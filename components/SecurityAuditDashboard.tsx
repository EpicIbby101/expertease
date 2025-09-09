'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Users, 
  Lock, 
  Activity,
  RefreshCw,
  Download,
  Eye,
  EyeOff
} from 'lucide-react';

interface SecurityIssue {
  id: string;
  type: 'weak_password' | 'inactive_account' | 'suspicious_activity' | 'privilege_escalation' | 'data_access';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  userId: string;
  userName: string;
  userEmail: string;
  detectedAt: string;
  resolved: boolean;
  metadata?: any;
}

interface SecurityMetrics {
  totalIssues: number;
  criticalIssues: number;
  highIssues: number;
  mediumIssues: number;
  lowIssues: number;
  resolvedIssues: number;
  activeUsers: number;
  inactiveUsers: number;
  weakPasswords: number;
  suspiciousActivities: number;
}

export function SecurityAuditDashboard() {
  const [issues, setIssues] = useState<SecurityIssue[]>([]);
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [showResolved, setShowResolved] = useState(false);

  const fetchSecurityData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/security-audit');
      if (!response.ok) throw new Error('Failed to fetch security data');
      
      const data = await response.json();
      setIssues(data.issues || []);
      setMetrics(data.metrics || null);
    } catch (error) {
      console.error('Error fetching security data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSecurityData();
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <XCircle className="h-4 w-4" />;
      case 'high': return <AlertTriangle className="h-4 w-4" />;
      case 'medium': return <AlertTriangle className="h-4 w-4" />;
      case 'low': return <CheckCircle className="h-4 w-4" />;
      default: return <Shield className="h-4 w-4" />;
    }
  };

  const filteredIssues = issues.filter(issue => showResolved || !issue.resolved);

  const exportSecurityReport = () => {
    const reportData = {
      generatedAt: new Date().toISOString(),
      metrics,
      issues: filteredIssues
    };
    
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `security-audit-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Security Audit Dashboard</h2>
          <p className="text-gray-400">Monitor and analyze security issues across the platform</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => setShowResolved(!showResolved)} 
            variant="outline"
            size="sm"
          >
            {showResolved ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
            {showResolved ? 'Hide Resolved' : 'Show Resolved'}
          </Button>
          <Button onClick={fetchSecurityData} variant="outline" disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={exportSecurityReport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Security Metrics */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Issues</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalIssues}</div>
              <p className="text-xs text-muted-foreground">
                {metrics.resolvedIssues} resolved
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Critical Issues</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{metrics.criticalIssues}</div>
              <p className="text-xs text-muted-foreground">
                Immediate attention required
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Weak Passwords</CardTitle>
              <Lock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{metrics.weakPasswords}</div>
              <p className="text-xs text-muted-foreground">
                Users with weak passwords
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inactive Users</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{metrics.inactiveUsers}</div>
              <p className="text-xs text-muted-foreground">
                No activity in 30+ days
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Security Issues Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="critical">Critical</TabsTrigger>
          <TabsTrigger value="high">High Priority</TabsTrigger>
          <TabsTrigger value="medium">Medium Priority</TabsTrigger>
          <TabsTrigger value="low">Low Priority</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Issue Distribution</CardTitle>
                <CardDescription>Security issues by severity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-600" />
                      <span>Critical</span>
                    </div>
                    <Badge variant="destructive">{metrics?.criticalIssues || 0}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                      <span>High</span>
                    </div>
                    <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                      {metrics?.highIssues || 0}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <span>Medium</span>
                    </div>
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                      {metrics?.mediumIssues || 0}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-blue-600" />
                      <span>Low</span>
                    </div>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      {metrics?.lowIssues || 0}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest security events</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {filteredIssues.slice(0, 5).map((issue) => (
                    <div key={issue.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getSeverityIcon(issue.severity)}
                        <div>
                          <p className="font-medium text-sm">{issue.title}</p>
                          <p className="text-xs text-gray-600">{issue.userName}</p>
                        </div>
                      </div>
                      <Badge className={getSeverityColor(issue.severity)}>
                        {issue.severity}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {['critical', 'high', 'medium', 'low'].map((severity) => (
          <TabsContent key={severity} value={severity} className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="capitalize">
                  {severity === 'high' ? 'High Priority' : severity} Issues
                </CardTitle>
                <CardDescription>
                  {filteredIssues.filter(issue => issue.severity === severity).length} issues found
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredIssues
                    .filter(issue => issue.severity === severity)
                    .map((issue) => (
                      <div key={issue.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {getSeverityIcon(issue.severity)}
                              <h3 className="font-medium">{issue.title}</h3>
                              <Badge className={getSeverityColor(issue.severity)}>
                                {issue.severity}
                              </Badge>
                              {issue.resolved && (
                                <Badge variant="secondary" className="bg-green-100 text-green-800">
                                  Resolved
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{issue.description}</p>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span>User: {issue.userName} ({issue.userEmail})</span>
                              <span>Detected: {new Date(issue.detectedAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              View Details
                            </Button>
                            {!issue.resolved && (
                              <Button size="sm" variant="default">
                                Resolve
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  
                  {filteredIssues.filter(issue => issue.severity === severity).length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                      <p>No {severity} issues found</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
