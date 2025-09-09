import { RoleGate } from '../../../components/RoleGate';
import { SecurityAuditDashboard } from '../../../components/SecurityAuditDashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, FileText } from 'lucide-react';
import Link from 'next/link';

export default function SecurityAuditPage() {
  return (
    <RoleGate requiredRole="site_admin">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Security Audit</h1>
            <p className="text-gray-600 mt-1">User security analysis and risk assessment</p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/admin/audit-logs"
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <FileText className="h-4 w-4 mr-2" />
              View Audit Logs
            </Link>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-red-600" />
              Security Audit Dashboard
            </CardTitle>
            <CardDescription>
              Comprehensive security analysis including weak passwords, inactive accounts, and suspicious activity patterns.
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
