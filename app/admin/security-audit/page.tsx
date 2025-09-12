import { RoleGate } from '../../../components/RoleGate';
import { SecurityAuditDashboard } from '../../../components/SecurityAuditDashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, FileText, AlertTriangle, CheckCircle, Clock, Users, Lock, Activity, RefreshCw, Download, Eye } from 'lucide-react';
import Link from 'next/link';

export default function SecurityAuditPage() {
  return (
    <RoleGate requiredRole="site_admin">
      <div className="space-y-6">
        {/* Enhanced Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Security Audit</h1>
            <p className="text-gray-600 mt-1">Comprehensive security analysis and risk assessment</p>
          </div>
          <div className="flex gap-2">
            <Link href="/admin/audit-logs">
              <Button className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                View Audit Logs
              </Button>
            </Link>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Security Status Banner */}
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-green-900">Security Status: Good</h3>
                <p className="text-sm text-green-700">No critical security issues detected. System is running securely.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Security Overview */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="hover:shadow-md transition-shadow border-l-4 border-l-red-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Critical Issues</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">0</div>
              <p className="text-xs text-gray-500 mt-1">Immediate attention required</p>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-md transition-shadow border-l-4 border-l-orange-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">High Priority</CardTitle>
              <Shield className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">0</div>
              <p className="text-xs text-gray-500 mt-1">Security concerns</p>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-md transition-shadow border-l-4 border-l-yellow-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Weak Passwords</CardTitle>
              <Lock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">0</div>
              <p className="text-xs text-gray-500 mt-1">Need strengthening</p>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-md transition-shadow border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Active Users</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">0</div>
              <p className="text-xs text-gray-500 mt-1">Recently active</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Security Dashboard */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-600" />
              Security Audit Dashboard
            </CardTitle>
            <CardDescription>
              Detailed security analysis including weak passwords, inactive accounts, and suspicious activity patterns.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SecurityAuditDashboard />
          </CardContent>
        </Card>
      </div>
    </RoleGate>
  );
}

