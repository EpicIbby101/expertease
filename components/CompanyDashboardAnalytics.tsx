'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  BookOpen, 
  Award, 
  Activity, 
  Calendar,
  RefreshCw,
  Target,
  Clock
} from 'lucide-react';
import { format, subDays } from 'date-fns';
import { toast } from 'sonner';

interface CompanyAnalytics {
  totalTrainees: number;
  activeTrainees: number;
  completedCourses: number;
  averageScore: number;
  traineeEngagement: number;
  courseProgress: Array<{
    courseId: string;
    courseName: string;
    totalTrainees: number;
    completedTrainees: number;
    averageScore: number;
    completionRate: number;
  }>;
  traineeActivity: Array<{
    date: string;
    activeUsers: number;
    completedLessons: number;
    newRegistrations: number;
  }>;
  traineePerformance: Array<{
    traineeId: string;
    traineeName: string;
    totalCourses: number;
    completedCourses: number;
    averageScore: number;
    lastActivity: string;
    engagementScore: number;
  }>;
}

interface CompanyDashboardAnalyticsProps {
  companyId: string;
  companyName: string;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export function CompanyDashboardAnalytics({ companyId, companyName }: CompanyDashboardAnalyticsProps) {
  const [analytics, setAnalytics] = useState<CompanyAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30');

  useEffect(() => {
    fetchAnalytics();
  }, [companyId, timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/company/analytics?companyId=${companyId}&timeRange=${timeRange}`);
      const data = await response.json();
      
      if (response.ok) {
        setAnalytics(data.analytics || null);
      } else {
        toast.error('Failed to fetch company analytics');
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('An error occurred while fetching analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading analytics...</span>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-8">
        <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No analytics data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total Trainees</p>
                <p className="text-3xl font-bold text-blue-900">{analytics.totalTrainees}</p>
                <p className="text-sm text-blue-600 mt-2">
                  {analytics.activeTrainees} active
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Completed Courses</p>
                <p className="text-3xl font-bold text-green-900">{analytics.completedCourses}</p>
                <p className="text-sm text-green-600 mt-2">
                  {analytics.totalTrainees > 0 ? ((analytics.completedCourses / analytics.totalTrainees) * 100).toFixed(1) : 0}% completion rate
                </p>
              </div>
              <BookOpen className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Average Score</p>
                <p className="text-3xl font-bold text-purple-900">{analytics.averageScore.toFixed(1)}%</p>
                <p className="text-sm text-purple-600 mt-2">
                  Company average
                </p>
              </div>
              <Award className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">Engagement</p>
                <p className="text-3xl font-bold text-orange-900">{analytics.traineeEngagement.toFixed(1)}%</p>
                <div className="flex items-center mt-2">
                  {analytics.traineeEngagement > 70 ? (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  )}
                  <span className="text-sm text-orange-600 ml-1">
                    {analytics.traineeEngagement > 70 ? 'High' : 'Low'} engagement
                  </span>
                </div>
              </div>
              <Activity className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Course Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Course Progress
            </CardTitle>
            <CardDescription>Completion rates by course</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.courseProgress.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.courseProgress}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="courseName" 
                    stroke="#6b7280"
                    fontSize={12}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis stroke="#6b7280" fontSize={12} />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    formatter={(value: any, name: string) => [
                      `${value}${name === 'completionRate' ? '%' : ''}`,
                      name === 'completionRate' ? 'Completion Rate' : name
                    ]}
                  />
                  <Bar dataKey="completionRate" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                <div className="text-center">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>No course data available</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Trainee Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Trainee Activity
            </CardTitle>
            <CardDescription>Daily activity over time</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.traineeActivity.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={analytics.traineeActivity}>
                  <defs>
                    <linearGradient id="activityGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#6b7280"
                    fontSize={12}
                    tickFormatter={(value) => format(new Date(value), 'MMM dd')}
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
                    dataKey="activeUsers"
                    stackId="1"
                    stroke="#10b981"
                    fill="url(#activityGradient)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                <div className="text-center">
                  <Activity className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>No activity data available</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Performers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Top Performing Trainees
          </CardTitle>
          <CardDescription>Best performing trainees in your company</CardDescription>
        </CardHeader>
        <CardContent>
          {analytics.traineePerformance.length > 0 ? (
            <div className="space-y-3">
              {analytics.traineePerformance.slice(0, 5).map((trainee, index) => (
                <div key={trainee.traineeId} className="flex items-center justify-between p-4 rounded-lg border bg-gray-50">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-blue-600">#{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{trainee.traineeName}</p>
                      <p className="text-sm text-gray-500">
                        {trainee.completedCourses}/{trainee.totalCourses} courses completed
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">{trainee.averageScore.toFixed(1)}%</div>
                    <div className="text-xs text-gray-500">Average Score</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No performance data available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Refresh Button */}
      <div className="flex justify-center">
        <Button onClick={fetchAnalytics} variant="outline" className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh Analytics
        </Button>
      </div>
    </div>
  );
}

export default CompanyDashboardAnalytics;
