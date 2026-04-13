'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Building, 
  Activity, 
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  Calendar,
  RefreshCw
} from 'lucide-react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { toast } from 'sonner';
import { CompanyHealthMonitor } from './CompanyHealthMonitor';

interface CompanyAnalytics {
  companyId: string;
  companyName: string;
  healthScore: number;
  userCount: number;
  activeUsers: number;
  traineeCount: number;
  adminCount: number;
  lastActivity: string;
  growthRate: number;
  activityTrend: number;
  maxTrainees: number;
  utilizationRate: number;
}

interface CompanyMetrics {
  totalCompanies: number;
  activeCompanies: number;
  totalUsers: number;
  totalTrainees: number;
  averageHealthScore: number;
  companiesAtCapacity: number;
  inactiveCompanies: number;
  growthRate: number;
}

interface TimeSeriesData {
  date: string;
  companies: number;
  users: number;
  trainees: number;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export function CompanyAnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<CompanyAnalytics[]>([]);
  const [metrics, setMetrics] = useState<CompanyMetrics | null>(null);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30');
  const [selectedMetric, setSelectedMetric] = useState('companies');
  const [activeTab, setActiveTab] = useState<'overview' | 'health'>('overview');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/companies/analytics?timeRange=${timeRange}`);
      const data = await response.json();
      
      if (response.ok) {
        setAnalytics(data.analytics || []);
        setMetrics(data.metrics || null);
        setTimeSeriesData(data.timeSeries || []);
      } else {
        toast.error('Failed to fetch analytics data');
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('An error occurred while fetching analytics');
    } finally {
      setLoading(false);
    }
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getHealthScoreIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="h-4 w-4" />;
    if (score >= 60) return <Clock className="h-4 w-4" />;
    return <AlertTriangle className="h-4 w-4" />;
  };

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (trend < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Activity className="h-4 w-4 text-gray-600" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading analytics...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Company Analytics</h2>
          <p className="text-gray-600">Comprehensive insights into company performance and health</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={fetchAnalytics} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Analytics Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'overview'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <BarChart3 className="h-4 w-4 mr-2 inline" />
          Overview & Trends
        </button>
        <button
          onClick={() => setActiveTab('health')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'health'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Activity className="h-4 w-4 mr-2 inline" />
          Health Monitoring
        </button>
      </div>

      {activeTab === 'overview' && (
        <>

      {/* Key Metrics */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Total Companies</p>
                  <p className="text-3xl font-bold text-blue-900">{metrics.totalCompanies}</p>
                  <div className="flex items-center mt-2">
                    {getTrendIcon(metrics.growthRate)}
                    <span className="text-sm text-blue-600 ml-1">
                      {metrics.growthRate > 0 ? '+' : ''}{metrics.growthRate.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <Building className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Active Companies</p>
                  <p className="text-3xl font-bold text-green-900">{metrics.activeCompanies}</p>
                  <p className="text-sm text-green-600 mt-2">
                    {metrics.totalCompanies > 0 
                      ? ((metrics.activeCompanies / metrics.totalCompanies) * 100).toFixed(1) 
                      : 0}% active
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600">Total Users</p>
                  <p className="text-3xl font-bold text-purple-900">{metrics.totalUsers}</p>
                  <p className="text-sm text-purple-600 mt-2">
                    {metrics.totalTrainees} trainees
                  </p>
                </div>
                <Users className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600">Avg Health Score</p>
                  <p className="text-3xl font-bold text-orange-900">{metrics.averageHealthScore.toFixed(1)}</p>
                  <div className="flex items-center mt-2">
                    {getHealthScoreIcon(metrics.averageHealthScore)}
                    <span className="text-sm text-orange-600 ml-1">Health</span>
                  </div>
                </div>
                <Activity className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Growth Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Growth Trends
            </CardTitle>
            <CardDescription>Company and user growth over time</CardDescription>
          </CardHeader>
          <CardContent>
            {timeSeriesData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={timeSeriesData}>
                  <defs>
                    <linearGradient id="companyGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="userGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#6b7280"
                    fontSize={12}
                    tickFormatter={(value) => {
                      try {
                        const date = new Date(value);
                        if (isNaN(date.getTime())) return value;
                        return format(date, 'MMM dd');
                      } catch {
                        return value;
                      }
                    }}
                  />
                  <YAxis stroke="#6b7280" fontSize={12} />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="companies"
                    stackId="1"
                    stroke="#3b82f6"
                    fill="url(#companyGradient)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="users"
                    stackId="2"
                    stroke="#10b981"
                    fill="url(#userGradient)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>No growth data available</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Company Health Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Health Distribution
            </CardTitle>
            <CardDescription>Company health score distribution</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.length > 0 ? (() => {
              const healthData = [
                { name: 'Excellent (80+)', value: analytics.filter(a => a.healthScore >= 80).length, color: '#10b981' },
                { name: 'Good (60-79)', value: analytics.filter(a => a.healthScore >= 60 && a.healthScore < 80).length, color: '#f59e0b' },
                { name: 'Needs Attention (<60)', value: analytics.filter(a => a.healthScore < 60).length, color: '#ef4444' }
              ].filter(item => item.value > 0); // Only show categories with data
              
              return healthData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={healthData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value, percent }) =>
                        `${name}: ${value} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                    >
                      {healthData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-500">
                  <div className="text-center">
                    <Activity className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p>No health data available</p>
                  </div>
                </div>
              );
            })() : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                <div className="text-center">
                  <Activity className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>No health data available</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Company Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Company Performance
          </CardTitle>
          <CardDescription>Detailed performance metrics for each company</CardDescription>
        </CardHeader>
        <CardContent>
          {analytics.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Company</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Health Score</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Users</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Utilization</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Growth</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Last Activity</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.map((company) => (
                    <tr key={company.companyId} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900">{company.companyName}</div>
                        <div className="text-sm text-gray-500">{company.traineeCount} trainees</div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={getHealthScoreColor(company.healthScore)}>
                          {getHealthScoreIcon(company.healthScore)}
                          <span className="ml-1">{(company.healthScore || 0).toFixed(1)}</span>
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm">
                          <div className="font-medium">{company.userCount}</div>
                          <div className="text-gray-500">{company.activeUsers} active</div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm">
                          <div className="font-medium">{(company.utilizationRate || 0).toFixed(1)}%</div>
                          <div className="text-gray-500">{company.traineeCount || 0}/{company.maxTrainees || 0}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          {getTrendIcon(company.growthRate || 0)}
                          <span className="ml-1 text-sm">
                            {(company.growthRate || 0) > 0 ? '+' : ''}{(company.growthRate || 0).toFixed(1)}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500">
                        {(() => {
                          try {
                            const date = new Date(company.lastActivity);
                            if (isNaN(date.getTime())) return 'N/A';
                            return format(date, 'MMM dd, yyyy');
                          } catch {
                            return 'N/A';
                          }
                        })()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No analytics data available</p>
            </div>
          )}
        </CardContent>
      </Card>
        </>
      )}

      {activeTab === 'health' && (
        <CompanyHealthMonitor refreshTrigger={Date.now()} />
      )}
    </div>
  );
}
