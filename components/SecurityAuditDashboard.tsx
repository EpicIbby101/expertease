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
  EyeOff,
  Mail
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
      {/* Enhanced Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white">Security Analysis</h2>
          <p className="text-sm text-gray-400">Monitor and analyze security issues across the platform</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => setShowResolved(!showResolved)} 
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            {showResolved ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showResolved ? 'Hide Resolved' : 'Show Resolved'}
          </Button>
          <Button 
            onClick={fetchSecurityData} 
            variant="outline" 
            size="sm"
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            onClick={exportSecurityReport} 
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Enhanced Security Metrics */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="hover:shadow-md transition-shadow border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Issues</CardTitle>
              <Shield className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{metrics.totalIssues}</div>
              <p className="text-xs text-gray-500">
                {metrics.resolvedIssues} resolved
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow border-l-4 border-l-red-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Critical Issues</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{metrics.criticalIssues}</div>
              <p className="text-xs text-gray-500">
                Immediate attention required
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow border-l-4 border-l-orange-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Weak Passwords</CardTitle>
              <Lock className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{metrics.weakPasswords}</div>
              <p className="text-xs text-gray-500">
                Users with weak passwords
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow border-l-4 border-l-yellow-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Inactive Users</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{metrics.inactiveUsers}</div>
              <p className="text-xs text-gray-500">
                No activity in 30+ days
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Enhanced Security Issues Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <TabsList className="grid w-full grid-cols-5 sm:w-auto">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="critical" className="flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              Critical
            </TabsTrigger>
            <TabsTrigger value="high" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              High
            </TabsTrigger>
            <TabsTrigger value="medium" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Medium
            </TabsTrigger>
            <TabsTrigger value="low" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Low
            </TabsTrigger>
          </TabsList>
          <div className="text-sm text-gray-500">
            {filteredIssues.length} total issues • {filteredIssues.filter(issue => !issue.resolved).length} unresolved
          </div>
        </div>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-600" />
                  Issue Distribution
                </CardTitle>
                <CardDescription>Security issues by severity level</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex items-center gap-3">
                      <XCircle className="h-5 w-5 text-red-600" />
                      <div>
                        <span className="font-medium text-red-900">Critical</span>
                        <p className="text-xs text-red-700">Immediate action required</p>
                      </div>
                    </div>
                    <Badge variant="destructive" className="text-sm px-3 py-1">
                      {metrics?.criticalIssues || 0}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-5 w-5 text-orange-600" />
                      <div>
                        <span className="font-medium text-orange-900">High</span>
                        <p className="text-xs text-orange-700">Address within 24 hours</p>
                      </div>
                    </div>
                    <Badge className="bg-orange-100 text-orange-800 text-sm px-3 py-1">
                      {metrics?.highIssues || 0}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-5 w-5 text-yellow-600" />
                      <div>
                        <span className="font-medium text-yellow-900">Medium</span>
                        <p className="text-xs text-yellow-700">Address within a week</p>
                      </div>
                    </div>
                    <Badge className="bg-yellow-100 text-yellow-800 text-sm px-3 py-1">
                      {metrics?.mediumIssues || 0}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-blue-600" />
                      <div>
                        <span className="font-medium text-blue-900">Low</span>
                        <p className="text-xs text-blue-700">Monitor and review</p>
                      </div>
                    </div>
                    <Badge className="bg-blue-100 text-blue-800 text-sm px-3 py-1">
                      {metrics?.lowIssues || 0}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-green-600" />
                  Recent Activity
                </CardTitle>
                <CardDescription>Latest security events and alerts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {filteredIssues.slice(0, 5).map((issue) => (
                    <div key={issue.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                          {getSeverityIcon(issue.severity)}
                        </div>
                        <div>
                          <p className="font-medium text-sm text-gray-900">{issue.title}</p>
                          <p className="text-xs text-gray-600">{issue.userName} • {new Date(issue.detectedAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getSeverityColor(issue.severity)}>
                          {issue.severity}
                        </Badge>
                        {issue.resolved && (
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            Resolved
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                  {filteredIssues.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                      <p>No security issues found</p>
                      <p className="text-sm">Your system is secure!</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {['critical', 'high', 'medium', 'low'].map((severity) => (
          <TabsContent key={severity} value={severity} className="space-y-4">
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 capitalize">
                  {getSeverityIcon(severity)}
                  {severity === 'high' ? 'High Priority' : severity} Issues
                  <Badge className={getSeverityColor(severity)}>
                    {filteredIssues.filter(issue => issue.severity === severity).length}
                  </Badge>
                </CardTitle>
                <CardDescription>
                  {filteredIssues.filter(issue => issue.severity === severity).length} {severity} priority issues found
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredIssues
                    .filter(issue => issue.severity === severity)
                    .map((issue) => (
                      <div key={issue.id} className="border rounded-lg p-4 hover:shadow-sm transition-shadow bg-white">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                                {getSeverityIcon(issue.severity)}
                              </div>
                              <div className="flex-1">
                                <h3 className="font-semibold text-gray-900">{issue.title}</h3>
                                <p className="text-sm text-gray-600">{issue.description}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge className={getSeverityColor(issue.severity)}>
                                  {issue.severity}
                                </Badge>
                                {issue.resolved && (
                                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                                    Resolved
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-6 text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                <span>{issue.userName}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4" />
                                <span>{issue.userEmail}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                <span>{new Date(issue.detectedAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <Button size="sm" variant="outline" className="flex items-center gap-2">
                              <Eye className="h-4 w-4" />
                              Details
                            </Button>
                            {!issue.resolved && (
                              <Button size="sm" className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4" />
                                Resolve
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  
                  {filteredIssues.filter(issue => issue.severity === severity).length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="h-8 w-8 text-green-600" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No {severity} issues found</h3>
                      <p className="text-sm">Great job! Your system is secure at this priority level.</p>
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

