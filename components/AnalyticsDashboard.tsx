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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Analytics Dashboard</h2>
          <p className="text-gray-400">Platform insights and performance metrics</p>
        </div>
        <div className="flex gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => fetchData(activeTab)} variant="outline" disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={exportData} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      {data.overview && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(data.overview.totalUsers)}</div>
              <p className="text-xs text-muted-foreground">
                +{data.overview.recentUsers} this period ({data.overview.userGrowthRate}% growth)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Companies</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(data.overview.totalCompanies)}</div>
              <p className="text-xs text-muted-foreground">
                +{data.overview.recentCompanies} this period ({data.overview.companyGrowthRate}% growth)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(data.overview.activeUsers)}</div>
              <p className="text-xs text-muted-foreground">
                {Math.round((data.overview.activeUsers / data.overview.totalUsers) * 100)}% of total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Companies</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(data.overview.activeCompanies)}</div>
              <p className="text-xs text-muted-foreground">
                {Math.round((data.overview.activeCompanies / data.overview.totalCompanies) * 100)}% of total
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Detailed Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="companies">Companies</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="growth">Growth</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>User Growth</CardTitle>
                <CardDescription>User registrations over time</CardDescription>
              </CardHeader>
              <CardContent>
                {data.userMetrics?.registrationsOverTime ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={data.userMetrics.registrationsOverTime}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tickFormatter={formatDate} />
                      <YAxis />
                      <Tooltip labelFormatter={formatDate} />
                      <Area type="monotone" dataKey="count" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
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
                <CardTitle>Company Growth</CardTitle>
                <CardDescription>Company registrations over time</CardDescription>
              </CardHeader>
              <CardContent>
                {data.companyMetrics?.registrationsOverTime ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={data.companyMetrics.registrationsOverTime}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tickFormatter={formatDate} />
                      <YAxis />
                      <Tooltip labelFormatter={formatDate} />
                      <Area type="monotone" dataKey="count" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
                    </AreaChart>
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

        <TabsContent value="users" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>User Registrations</CardTitle>
                <CardDescription>Daily user registrations</CardDescription>
              </CardHeader>
              <CardContent>
                {data.userMetrics?.registrationsOverTime ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data.userMetrics.registrationsOverTime}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tickFormatter={formatDate} />
                      <YAxis />
                      <Tooltip labelFormatter={formatDate} />
                      <Bar dataKey="count" fill="#8884d8" />
                    </BarChart>
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
                <CardTitle>Role Distribution</CardTitle>
                <CardDescription>Distribution of user roles</CardDescription>
              </CardHeader>
              <CardContent>
                {data.userMetrics?.roleDistribution && data.userMetrics.roleDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={data.userMetrics.roleDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {data.userMetrics.roleDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
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

        <TabsContent value="companies" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Company Registrations</CardTitle>
                <CardDescription>Daily company registrations</CardDescription>
              </CardHeader>
              <CardContent>
                {data.companyMetrics?.registrationsOverTime ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={data.companyMetrics.registrationsOverTime}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tickFormatter={formatDate} />
                      <YAxis />
                      <Tooltip labelFormatter={formatDate} />
                      <Line type="monotone" dataKey="count" stroke="#82ca9d" strokeWidth={2} />
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
