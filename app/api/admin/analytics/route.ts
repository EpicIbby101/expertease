import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30d'; // 7d, 30d, 90d, 1y
    const metric = searchParams.get('metric') || 'overview'; // overview, users, companies, activity

    // Calculate date range based on period
    const now = new Date();
    let startDate: Date;
    
    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = now.toISOString().split('T')[0];

    switch (metric) {
      case 'overview':
        return await getOverviewMetrics(startDateStr, endDateStr);
      case 'users':
        return await getUserMetrics(startDateStr, endDateStr, period);
      case 'companies':
        return await getCompanyMetrics(startDateStr, endDateStr, period);
      case 'activity':
        return await getActivityMetrics(startDateStr, endDateStr, period);
      case 'growth':
        return await getGrowthMetrics(startDateStr, endDateStr, period);
      case 'usage':
        return await getUsageMetrics(startDateStr, endDateStr, period);
      default:
        return await getOverviewMetrics(startDateStr, endDateStr);
    }

  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function getOverviewMetrics(startDate: string, endDate: string) {
  // Get total counts
  const [
    { count: totalUsers },
    { count: totalCompanies },
    { count: activeUsers },
    { count: activeCompanies }
  ] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('companies').select('*', { count: 'exact', head: true }),
    supabase.from('users').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('companies').select('*', { count: 'exact', head: true }).eq('is_active', true)
  ]);

  // Get recent registrations (last 30 days)
  const { data: recentUsers } = await supabase
    .from('users')
    .select('created_at')
    .gte('created_at', startDate)
    .lte('created_at', endDate)
    .order('created_at', { ascending: false });

  const { data: recentCompanies } = await supabase
    .from('companies')
    .select('created_at')
    .gte('created_at', startDate)
    .lte('created_at', endDate)
    .order('created_at', { ascending: false });

  // Calculate growth rates
  const userGrowthRate = calculateGrowthRate(recentUsers?.length || 0, totalUsers || 0);
  const companyGrowthRate = calculateGrowthRate(recentCompanies?.length || 0, totalCompanies || 0);

  return NextResponse.json({
    overview: {
      totalUsers: totalUsers || 0,
      totalCompanies: totalCompanies || 0,
      activeUsers: activeUsers || 0,
      activeCompanies: activeCompanies || 0,
      userGrowthRate,
      companyGrowthRate,
      recentUsers: recentUsers?.length || 0,
      recentCompanies: recentCompanies?.length || 0
    }
  });
}

async function getUserMetrics(startDate: string, endDate: string, period: string) {
  // Get user registrations over time
  const { data: userRegistrations } = await supabase
    .from('users')
    .select('created_at, role')
    .gte('created_at', startDate)
    .lte('created_at', endDate)
    .order('created_at', { ascending: true });

  // Group by time period
  const groupedData = groupDataByPeriod(userRegistrations || [], period, 'created_at');
  
  // Get role distribution
  const { data: roleDistribution } = await supabase
    .from('users')
    .select('role')
    .eq('is_active', true);

  const roleCounts = (roleDistribution || []).reduce((acc: Record<string, number>, user) => {
    acc[user.role] = (acc[user.role] || 0) + 1;
    return acc;
  }, {});

  return NextResponse.json({
    userMetrics: {
      registrationsOverTime: groupedData,
      roleDistribution,
      totalRegistrations: userRegistrations?.length || 0
    }
  });
}

async function getCompanyMetrics(startDate: string, endDate: string, period: string) {
  // Get company registrations over time
  const { data: companyRegistrations } = await supabase
    .from('companies')
    .select('created_at, max_trainees, is_active')
    .gte('created_at', startDate)
    .lte('created_at', endDate)
    .order('created_at', { ascending: true });

  // Group by time period
  const groupedData = groupDataByPeriod(companyRegistrations || [], period, 'created_at');

  // Get company size distribution
  const sizeDistribution = (companyRegistrations || []).reduce((acc: Record<string, number>, company) => {
    const size = company.max_trainees || 0;
    let category = 'Unknown';
    if (size === 0) category = 'No Limit';
    else if (size <= 10) category = '1-10';
    else if (size <= 50) category = '11-50';
    else if (size <= 100) category = '51-100';
    else category = '100+';
    
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {});

  return NextResponse.json({
    companyMetrics: {
      registrationsOverTime: groupedData,
      sizeDistribution,
      totalRegistrations: companyRegistrations?.length || 0
    }
  });
}

async function getActivityMetrics(startDate: string, endDate: string, period: string) {
  // Get audit logs for activity metrics
  const { data: auditLogs } = await supabase
    .from('audit_logs')
    .select('created_at, action, resource_type')
    .gte('created_at', startDate)
    .lte('created_at', endDate)
    .order('created_at', { ascending: true });

  // Group by time period
  const groupedData = groupDataByPeriod(auditLogs || [], period, 'created_at');

  // Get action distribution
  const actionCounts = (auditLogs || []).reduce((acc: Record<string, number>, log) => {
    acc[log.action] = (acc[log.action] || 0) + 1;
    return acc;
  }, {});

  // Get resource type distribution
  const resourceCounts = (auditLogs || []).reduce((acc: Record<string, number>, log) => {
    acc[log.resource_type] = (acc[log.resource_type] || 0) + 1;
    return acc;
  }, {});

  return NextResponse.json({
    activityMetrics: {
      activityOverTime: groupedData,
      actionDistribution: actionCounts,
      resourceDistribution: resourceCounts,
      totalActivities: auditLogs?.length || 0
    }
  });
}

function calculateGrowthRate(recent: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((recent / total) * 100 * 100) / 100; // Round to 2 decimal places
}

function groupDataByPeriod(data: any[], period: string, dateField: string) {
  const groups: Record<string, number> = {};
  
  data.forEach(item => {
    const date = new Date(item[dateField]);
    let key: string;
    
    switch (period) {
      case '7d':
        key = date.toISOString().split('T')[0]; // Daily
        break;
      case '30d':
        key = date.toISOString().split('T')[0]; // Daily
        break;
      case '90d':
        // Group by week
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
        break;
      case '1y':
        // Group by month
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        break;
      default:
        key = date.toISOString().split('T')[0];
    }
    
    groups[key] = (groups[key] || 0) + 1;
  });
  
  return Object.entries(groups)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

async function getGrowthMetrics(startDate: string, endDate: string, period: string) {
  // Get user growth trends
  const { data: userGrowth } = await supabase
    .from('users')
    .select('created_at, is_active')
    .gte('created_at', startDate)
    .lte('created_at', endDate)
    .order('created_at', { ascending: true });

  // Get company growth trends
  const { data: companyGrowth } = await supabase
    .from('companies')
    .select('created_at, is_active')
    .gte('created_at', startDate)
    .lte('created_at', endDate)
    .order('created_at', { ascending: true });

  // Calculate cumulative growth
  const userGrowthData = calculateCumulativeGrowth(userGrowth || [], period);
  const companyGrowthData = calculateCumulativeGrowth(companyGrowth || [], period);

  // Calculate retention metrics (simplified - users active in last 7 days)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { count: activeUsersLast7Days } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)
    .gte('created_at', sevenDaysAgo);

  const { count: totalUsers } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true });

  const retentionRate = totalUsers ? Math.round((activeUsersLast7Days || 0) / totalUsers * 100) : 0;

  return NextResponse.json({
    growthMetrics: {
      userGrowth: userGrowthData,
      companyGrowth: companyGrowthData,
      retentionRate,
      totalActiveUsers: activeUsersLast7Days || 0,
      totalUsers: totalUsers || 0
    }
  });
}

async function getUsageMetrics(startDate: string, endDate: string, period: string) {
  // Get platform usage patterns
  const { data: auditLogs } = await supabase
    .from('audit_logs')
    .select('created_at, action, resource_type, user_id')
    .gte('created_at', startDate)
    .lte('created_at', endDate)
    .order('created_at', { ascending: true });

  // Get user activity patterns
  const { data: userActivity } = await supabase
    .from('users')
    .select('created_at, last_sign_in_at, is_active')
    .gte('created_at', startDate)
    .lte('created_at', endDate);

  // Calculate daily active users
  const dailyActiveUsers = calculateDailyActiveUsers(auditLogs || [], period);
  
  // Calculate feature usage
  const featureUsage = calculateFeatureUsage(auditLogs || []);
  
  // Calculate peak usage hours
  const peakHours = calculatePeakUsageHours(auditLogs || []);

  // Calculate user engagement score (simplified)
  const engagementScore = calculateEngagementScore(auditLogs || [], userActivity || []);

  return NextResponse.json({
    usageMetrics: {
      dailyActiveUsers,
      featureUsage,
      peakHours,
      engagementScore,
      totalActivities: auditLogs?.length || 0,
      uniqueActiveUsers: new Set(auditLogs?.map(log => log.user_id)).size
    }
  });
}

function calculateCumulativeGrowth(data: any[], period: string) {
  const grouped = groupDataByPeriod(data, period, 'created_at');
  let cumulative = 0;
  
  return grouped.map(item => {
    cumulative += item.count;
    return {
      date: item.date,
      count: item.count,
      cumulative
    };
  });
}

function calculateDailyActiveUsers(auditLogs: any[], period: string) {
  const userActivityByDate: Record<string, Set<string>> = {};
  
  auditLogs.forEach(log => {
    const date = new Date(log.created_at).toISOString().split('T')[0];
    if (!userActivityByDate[date]) {
      userActivityByDate[date] = new Set();
    }
    userActivityByDate[date].add(log.user_id);
  });

  return Object.entries(userActivityByDate)
    .map(([date, users]) => ({ date, count: users.size }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function calculateFeatureUsage(auditLogs: any[]) {
  const featureCounts: Record<string, number> = {};
  
  auditLogs.forEach(log => {
    const feature = log.action.split('_')[0]; // Extract feature from action
    featureCounts[feature] = (featureCounts[feature] || 0) + 1;
  });

  return Object.entries(featureCounts)
    .map(([feature, count]) => ({ feature, count }))
    .sort((a, b) => b.count - a.count);
}

function calculatePeakUsageHours(auditLogs: any[]) {
  const hourCounts: Record<number, number> = {};
  
  auditLogs.forEach(log => {
    const hour = new Date(log.created_at).getHours();
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  });

  return Object.entries(hourCounts)
    .map(([hour, count]) => ({ hour: parseInt(hour), count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5); // Top 5 peak hours
}

function calculateEngagementScore(auditLogs: any[], userActivity: any[]): number {
  if (userActivity.length === 0) return 0;
  
  const totalActivities = auditLogs.length;
  const totalUsers = userActivity.length;
  const avgActivitiesPerUser = totalActivities / totalUsers;
  
  // Simple engagement score (0-100)
  const score = Math.min(100, Math.round(avgActivitiesPerUser * 10));
  return score;
}
