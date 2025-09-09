import { RoleGate } from '../../../components/RoleGate';
import { AnalyticsDashboard } from '../../../components/AnalyticsDashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';

export default function AnalyticsPage() {
  return (
    <RoleGate requiredRole="site_admin">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Analytics</h1>
            <p className="text-gray-600 mt-1">Platform insights and performance metrics</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              Platform Analytics
            </CardTitle>
            <CardDescription>
              Comprehensive analytics dashboard with user growth, company metrics, and platform activity insights.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AnalyticsDashboard />
          </CardContent>
        </Card>
      </div>
    </RoleGate>
  );
}
