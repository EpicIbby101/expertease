'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  TrendingDown,
  Users,
  Activity,
  Zap,
  Target,
  RefreshCw
} from 'lucide-react';
import { format, differenceInDays, differenceInHours } from 'date-fns';
import { toast } from 'sonner';

interface CompanyHealthData {
  companyId: string;
  companyName: string;
  healthScore: number;
  status: 'excellent' | 'good' | 'warning' | 'critical';
  metrics: {
    userEngagement: number;
    activityLevel: number;
    capacityUtilization: number;
    adminPresence: number;
    recentGrowth: number;
  };
  alerts: Array<{
    type: 'warning' | 'critical' | 'info';
    message: string;
    timestamp: string;
  }>;
  lastActivity: string;
  recommendations: string[];
}

interface HealthMonitorProps {
  refreshTrigger?: number;
}

export function CompanyHealthMonitor({ refreshTrigger }: HealthMonitorProps) {
  const [healthData, setHealthData] = useState<CompanyHealthData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);

  useEffect(() => {
    fetchHealthData();
  }, [refreshTrigger]);

  const fetchHealthData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/companies/health');
      const data = await response.json();
      
      if (response.ok) {
        setHealthData(data.healthData || []);
      } else {
        toast.error('Failed to fetch company health data');
      }
    } catch (error) {
      console.error('Error fetching health data:', error);
      toast.error('An error occurred while fetching health data');
    } finally {
      setLoading(false);
    }
  };

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'text-green-600 bg-green-100 border-green-200';
      case 'good':
        return 'text-blue-600 bg-blue-100 border-blue-200';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'critical':
        return 'text-red-600 bg-red-100 border-red-200';
      default:
        return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getHealthStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent':
        return <CheckCircle className="h-4 w-4" />;
      case 'good':
        return <CheckCircle className="h-4 w-4" />;
      case 'warning':
        return <Clock className="h-4 w-4" />;
      case 'critical':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'warning':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'info':
        return <Activity className="h-4 w-4 text-blue-600" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const hoursAgo = differenceInHours(now, time);
    
    if (hoursAgo < 1) return 'Just now';
    if (hoursAgo < 24) return `${hoursAgo}h ago`;
    const daysAgo = differenceInDays(now, time);
    return `${daysAgo}d ago`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading health data...</span>
      </div>
    );
  }

  const criticalCompanies = healthData.filter(c => c.status === 'critical');
  const warningCompanies = healthData.filter(c => c.status === 'warning');
  const excellentCompanies = healthData.filter(c => c.status === 'excellent');

  return (
    <div className="space-y-6">
      {/* Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Excellent Health</p>
                <p className="text-3xl font-bold text-green-900">{excellentCompanies.length}</p>
                <p className="text-sm text-green-600 mt-2">
                  {healthData.length > 0 ? ((excellentCompanies.length / healthData.length) * 100).toFixed(1) : 0}% of companies
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-600">Needs Attention</p>
                <p className="text-3xl font-bold text-yellow-900">{warningCompanies.length + criticalCompanies.length}</p>
                <p className="text-sm text-yellow-600 mt-2">
                  {healthData.length > 0 ? (((warningCompanies.length + criticalCompanies.length) / healthData.length) * 100).toFixed(1) : 0}% of companies
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">Critical Issues</p>
                <p className="text-3xl font-bold text-red-900">{criticalCompanies.length}</p>
                <p className="text-sm text-red-600 mt-2">
                  {criticalCompanies.length > 0 ? 'Immediate action required' : 'All systems healthy'}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Company Health Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Health Scores */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Company Health Scores
            </CardTitle>
            <CardDescription>Detailed health metrics for each company</CardDescription>
          </CardHeader>
          <CardContent>
            {healthData.length > 0 ? (
              <div className="space-y-4">
                {healthData.map((company) => (
                  <div key={company.companyId} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge className={getHealthStatusColor(company.status)}>
                          {getHealthStatusIcon(company.status)}
                          <span className="ml-1 capitalize">{company.status}</span>
                        </Badge>
                        <span className="font-medium text-gray-900">{company.companyName}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900">{company.healthScore}</div>
                        <div className="text-xs text-gray-500">Health Score</div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">User Engagement</span>
                        <span className="font-medium">{company.metrics.userEngagement}%</span>
                      </div>
                      <Progress value={company.metrics.userEngagement} className="h-2" />
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Activity Level</span>
                        <span className="font-medium">{company.metrics.activityLevel}%</span>
                      </div>
                      <Progress value={company.metrics.activityLevel} className="h-2" />
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Capacity Utilization</span>
                        <span className="font-medium">{company.metrics.capacityUtilization}%</span>
                      </div>
                      <Progress value={company.metrics.capacityUtilization} className="h-2" />
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>Last activity: {getTimeAgo(company.lastActivity)}</span>
                      <div className="flex items-center gap-1">
                        {company.metrics.recentGrowth > 0 ? (
                          <TrendingUp className="h-4 w-4 text-green-600" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-600" />
                        )}
                        <span className={company.metrics.recentGrowth > 0 ? 'text-green-600' : 'text-red-600'}>
                          {company.metrics.recentGrowth > 0 ? '+' : ''}{company.metrics.recentGrowth}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No health data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Alerts and Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Alerts & Recommendations
            </CardTitle>
            <CardDescription>Important notifications and suggested actions</CardDescription>
          </CardHeader>
          <CardContent>
            {healthData.some(c => c.alerts.length > 0 || c.recommendations.length > 0) ? (
              <div className="space-y-4">
                {healthData
                  .filter(c => c.alerts.length > 0 || c.recommendations.length > 0)
                  .map((company) => (
                    <div key={company.companyId} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{company.companyName}</span>
                        <Badge variant="outline" className="text-xs">
                          {company.alerts.length + company.recommendations.length} items
                        </Badge>
                      </div>
                      
                      {/* Alerts */}
                      {company.alerts.map((alert, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                          {getAlertIcon(alert.type)}
                          <div className="flex-1">
                            <p className="text-sm text-gray-900">{alert.message}</p>
                            <p className="text-xs text-gray-500 mt-1">{getTimeAgo(alert.timestamp)}</p>
                          </div>
                        </div>
                      ))}
                      
                      {/* Recommendations */}
                      {company.recommendations.map((recommendation, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                          <Activity className="h-4 w-4 text-blue-600 mt-0.5" />
                          <p className="text-sm text-blue-900">{recommendation}</p>
                        </div>
                      ))}
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
                <p className="text-gray-600">All companies are healthy!</p>
                <p className="text-sm text-gray-500 mt-2">No alerts or recommendations at this time.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Refresh Button */}
      <div className="flex justify-center">
        <Button onClick={fetchHealthData} variant="outline" className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh Health Data
        </Button>
      </div>
    </div>
  );
}
