'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts';
import { 
  Users, 
  Building, 
  TrendingUp, 
  Activity, 
  RefreshCw,
  Download,
  Calendar,
  BarChart3,
  PieChart as PieChartIcon
} from 'lucide-react';

interface OverviewMetrics {
  totalUsers: number;
  totalCompanies: number;
  activeUsers: number;
  activeCompanies: number;
  userGrowthRate: number;
  companyGrowthRate: number;
  recentUsers: number;
  recentCompanies: number;
}

interface TimeSeriesData {
  date: string;
  count: number;
}

interface DistributionData {
  name: string;
  value: number;
}

interface AnalyticsData {
  overview?: OverviewMetrics;
  userMetrics?: {
    registrationsOverTime: TimeSeriesData[];
    roleDistribution: DistributionData[];
    totalRegistrations: number;
  };
  companyMetrics?: {
    registrationsOverTime: TimeSeriesData[];
    sizeDistribution: DistributionData[];
    totalRegistrations: number;
  };
  activityMetrics?: {
    activityOverTime: TimeSeriesData[];
    actionDistribution: DistributionData[];
    resourceDistribution: DistributionData[];
    totalActivities: number;
  };
  growthMetrics?: {
    userGrowth: Array<TimeSeriesData & { cumulative: number }>;
    companyGrowth: Array<TimeSeriesData & { cumulative: number }>;
    retentionRate: number;
    totalActiveUsers: number;
    totalUsers: number;
  };
  usageMetrics?: {
    dailyActiveUsers: TimeSeriesData[];
    featureUsage: DistributionData[];
    peakHours: Array<{ hour: number; count: number }>;
    engagementScore: number;
    totalActivities: number;
    uniqueActiveUsers: number;
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData>({});
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState('30d');
  const [activeTab, setActiveTab] = useState('overview');

  const fetchData = async (metric: string = 'overview') => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/analytics?period=${period}&metric=${metric}`);
      if (!response.ok) throw new Error('Failed to fetch analytics');
      
      const result = await response.json();
      setData(prev => ({ ...prev, ...result }));
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData('overview');
  }, [period]);

  useEffect(() => {
    if (activeTab !== 'overview') {
      fetchData(activeTab);
    }
  }, [activeTab, period]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (period === '1y') {
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const exportData = () => {
    // Simple CSV export functionality
    const csvData = JSON.stringify(data, null, 2);
    const blob = new Blob([csvData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${period}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-lg p-6 border border-blue-200/20">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-white flex items-center gap-3">
              <BarChart3 className="h-8 w-8 text-blue-400" />
              Analytics Dashboard
            </h2>
            <p className="text-gray-300 mt-2">Comprehensive platform insights and performance metrics</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[160px] bg-white/10 border-white/20 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              onClick={() => fetchData(activeTab)} 
              variant="outline" 
              disabled={loading}
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button 
              onClick={exportData} 
              variant="outline"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Enhanced Overview Cards */}
      {data.overview && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-900">Total Users</CardTitle>
              <div className="p-2 bg-blue-500 rounded-lg">
                <Users className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-900 mb-1">{formatNumber(data.overview.totalUsers)}</div>
              <div className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-green-600" />
                <p className="text-xs text-green-600 font-medium">
                  +{data.overview.recentUsers} ({data.overview.userGrowthRate}% growth)
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-900">Total Companies</CardTitle>
              <div className="p-2 bg-green-500 rounded-lg">
                <Building className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-900 mb-1">{formatNumber(data.overview.totalCompanies)}</div>
              <div className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-green-600" />
                <p className="text-xs text-green-600 font-medium">
                  +{data.overview.recentCompanies} ({data.overview.companyGrowthRate}% growth)
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-900">Active Users</CardTitle>
              <div className="p-2 bg-purple-500 rounded-lg">
                <Activity className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-900 mb-1">{formatNumber(data.overview.activeUsers)}</div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <p className="text-xs text-purple-600 font-medium">
                  {Math.round((data.overview.activeUsers / data.overview.totalUsers) * 100)}% of total users
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-orange-900">Active Companies</CardTitle>
              <div className="p-2 bg-orange-500 rounded-lg">
                <TrendingUp className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-900 mb-1">{formatNumber(data.overview.activeCompanies)}</div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <p className="text-xs text-orange-600 font-medium">
                  {Math.round((data.overview.activeCompanies / data.overview.totalCompanies) * 100)}% of total companies
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Simplified Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="growth" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Growth Trends
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex items-center gap-2">
              <PieChartIcon className="h-4 w-4" />
              Insights
            </TabsTrigger>
          </TabsList>
          <div className="text-sm text-gray-400">
            Showing data for the last {period}
          </div>
        </div>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  User Growth Trend
                </CardTitle>
                <CardDescription>Daily user registrations over the selected period</CardDescription>
              </CardHeader>
              <CardContent>
                {data.userMetrics?.registrationsOverTime ? (
                  <ResponsiveContainer width="100%" height={320}>
                    <AreaChart data={data.userMetrics.registrationsOverTime} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="userGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={formatDate}
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                        axisLine={{ stroke: '#e5e7eb' }}
                      />
                      <YAxis 
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                        axisLine={{ stroke: '#e5e7eb' }}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                        labelFormatter={formatDate}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="count" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        fill="url(#userGradient)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[320px] flex items-center justify-center text-gray-500 bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <Users className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                      <p>No user data available</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5 text-green-600" />
                  Company Growth Trend
                </CardTitle>
                <CardDescription>Daily company registrations over the selected period</CardDescription>
              </CardHeader>
              <CardContent>
                {data.companyMetrics?.registrationsOverTime ? (
                  <ResponsiveContainer width="100%" height={320}>
                    <AreaChart data={data.companyMetrics.registrationsOverTime} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="companyGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={formatDate}
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                        axisLine={{ stroke: '#e5e7eb' }}
                      />
                      <YAxis 
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                        axisLine={{ stroke: '#e5e7eb' }}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                        labelFormatter={formatDate}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="count" 
                        stroke="#10b981" 
                        strokeWidth={2}
                        fill="url(#companyGradient)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[320px] flex items-center justify-center text-gray-500 bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <Building className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                      <p>No company data available</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="growth" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                  User Growth Analysis
                </CardTitle>
                <CardDescription>Detailed user registration patterns and trends</CardDescription>
              </CardHeader>
              <CardContent>
                {data.userMetrics?.registrationsOverTime ? (
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={data.userMetrics.registrationsOverTime} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={formatDate}
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                        axisLine={{ stroke: '#e5e7eb' }}
                      />
                      <YAxis 
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                        axisLine={{ stroke: '#e5e7eb' }}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                        labelFormatter={formatDate}
                      />
                      <Bar 
                        dataKey="count" 
                        fill="#8b5cf6"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[320px] flex items-center justify-center text-gray-500 bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <TrendingUp className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                      <p>No growth data available</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5 text-green-600" />
                  Company Growth Analysis
                </CardTitle>
                <CardDescription>Company registration trends and patterns</CardDescription>
              </CardHeader>
              <CardContent>
                {data.companyMetrics?.registrationsOverTime ? (
                  <ResponsiveContainer width="100%" height={320}>
                    <LineChart data={data.companyMetrics.registrationsOverTime} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={formatDate}
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                        axisLine={{ stroke: '#e5e7eb' }}
                      />
                      <YAxis 
                        tick={{ fontSize: 12, fill: '#6b7280' }}
                        axisLine={{ stroke: '#e5e7eb' }}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                        labelFormatter={formatDate}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="count" 
                        stroke="#10b981" 
                        strokeWidth={3}
                        dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[320px] flex items-center justify-center text-gray-500 bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <Building className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                      <p>No company growth data available</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5 text-purple-600" />
                  User Role Distribution
                </CardTitle>
                <CardDescription>Breakdown of users by role type</CardDescription>
              </CardHeader>
              <CardContent>
                {data.userMetrics?.roleDistribution && data.userMetrics.roleDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height={320}>
                    <PieChart>
                      <Pie
                        data={data.userMetrics.roleDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8b5cf6"
                        dataKey="value"
                      >
                        {data.userMetrics.roleDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
                  <div className="h-[320px] flex items-center justify-center text-gray-500 bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <Users className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                      <p>No role distribution data available</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Company Size Distribution</CardTitle>
                <CardDescription>Distribution by max trainees</CardDescription>
              </CardHeader>
              <CardContent>
                {data.companyMetrics?.sizeDistribution && Object.keys(data.companyMetrics.sizeDistribution).length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={Object.entries(data.companyMetrics.sizeDistribution).map(([name, value]) => ({ name, value }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-gray-500">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Platform Activity</CardTitle>
                <CardDescription>System activity over time</CardDescription>
              </CardHeader>
              <CardContent>
                {data.activityMetrics?.activityOverTime ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={data.activityMetrics.activityOverTime}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tickFormatter={formatDate} />
                      <YAxis />
                      <Tooltip labelFormatter={formatDate} />
                      <Area type="monotone" dataKey="count" stroke="#ffc658" fill="#ffc658" fillOpacity={0.6} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-gray-500">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Action Distribution</CardTitle>
                <CardDescription>Most common system actions</CardDescription>
              </CardHeader>
              <CardContent>
                {data.activityMetrics?.actionDistribution && Object.keys(data.activityMetrics.actionDistribution).length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={Object.entries(data.activityMetrics.actionDistribution).map(([name, value]) => ({ name, value }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#ffc658" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-gray-500">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="growth" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Cumulative User Growth</CardTitle>
                <CardDescription>Total users over time</CardDescription>
              </CardHeader>
              <CardContent>
                {data.growthMetrics?.userGrowth ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={data.growthMetrics.userGrowth}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tickFormatter={formatDate} />
                      <YAxis />
                      <Tooltip labelFormatter={formatDate} />
                      <Line type="monotone" dataKey="cumulative" stroke="#8884d8" strokeWidth={3} />
                      <Line type="monotone" dataKey="count" stroke="#82ca9d" strokeWidth={2} strokeDasharray="5 5" />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-gray-500">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cumulative Company Growth</CardTitle>
                <CardDescription>Total companies over time</CardDescription>
              </CardHeader>
              <CardContent>
                {data.growthMetrics?.companyGrowth ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={data.growthMetrics.companyGrowth}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tickFormatter={formatDate} />
                      <YAxis />
                      <Tooltip labelFormatter={formatDate} />
                      <Line type="monotone" dataKey="cumulative" stroke="#82ca9d" strokeWidth={3} />
                      <Line type="monotone" dataKey="count" stroke="#8884d8" strokeWidth={2} strokeDasharray="5 5" />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-gray-500">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>User Retention</CardTitle>
                <CardDescription>Active users in last 7 days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {data.growthMetrics?.retentionRate || 0}%
                </div>
                <p className="text-sm text-gray-600">
                  {data.growthMetrics?.totalActiveUsers || 0} of {data.growthMetrics?.totalUsers || 0} users
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Growth Rate</CardTitle>
                <CardDescription>User growth this period</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  {data.overview?.userGrowthRate || 0}%
                </div>
                <p className="text-sm text-gray-600">
                  +{data.overview?.recentUsers || 0} new users
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Company Growth</CardTitle>
                <CardDescription>Company growth this period</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">
                  {data.overview?.companyGrowthRate || 0}%
                </div>
                <p className="text-sm text-gray-600">
                  +{data.overview?.recentCompanies || 0} new companies
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="usage" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Daily Active Users</CardTitle>
                <CardDescription>Unique users per day</CardDescription>
              </CardHeader>
              <CardContent>
                {data.usageMetrics?.dailyActiveUsers ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={data.usageMetrics.dailyActiveUsers}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tickFormatter={formatDate} />
                      <YAxis />
                      <Tooltip labelFormatter={formatDate} />
                      <Area type="monotone" dataKey="count" stroke="#ffc658" fill="#ffc658" fillOpacity={0.6} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-gray-500">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Feature Usage</CardTitle>
                <CardDescription>Most used platform features</CardDescription>
              </CardHeader>
              <CardContent>
                {data.usageMetrics?.featureUsage && data.usageMetrics.featureUsage.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data.usageMetrics.featureUsage.slice(0, 8)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="feature" angle={-45} textAnchor="end" height={100} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#ffc658" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-gray-500">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Peak Usage Hours</CardTitle>
                <CardDescription>Most active hours of the day</CardDescription>
              </CardHeader>
              <CardContent>
                {data.usageMetrics?.peakHours && data.usageMetrics.peakHours.length > 0 ? (
                  <div className="space-y-3">
                    {data.usageMetrics.peakHours.map((peak, index) => (
                      <div key={peak.hour} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                          <span className="font-medium">{peak.hour}:00 - {peak.hour + 1}:00</span>
                        </div>
                        <span className="text-sm text-gray-600">{peak.count} activities</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-[200px] flex items-center justify-center text-gray-500">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Engagement Metrics</CardTitle>
                <CardDescription>Platform engagement score</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-green-600">
                      {data.usageMetrics?.engagementScore || 0}
                    </div>
                    <p className="text-sm text-gray-600">Engagement Score (0-100)</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold">{data.usageMetrics?.uniqueActiveUsers || 0}</div>
                      <p className="text-xs text-gray-600">Active Users</p>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{data.usageMetrics?.totalActivities || 0}</div>
                      <p className="text-xs text-gray-600">Total Activities</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
