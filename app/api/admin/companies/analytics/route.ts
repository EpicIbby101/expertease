import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is site admin
    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (!user || user.role !== 'site_admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '30';
    const days = parseInt(timeRange);

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    // Get companies with user data
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select(`
        id,
        name,
        slug,
        description,
        max_trainees,
        is_active,
        created_at,
        deleted_at
      `)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (companiesError) {
      console.error('Error fetching companies:', companiesError);
      return NextResponse.json({ error: 'Failed to fetch companies' }, { status: 500 });
    }

    // Get user counts for each company
    const companyIds = companies.map(c => c.id);
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, company_id, role, is_active, created_at, last_login_at')
      .in('company_id', companyIds)
      .is('deleted_at', null);

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    // Calculate analytics for each company
    const analytics = companies.map(company => {
      const companyUsers = users?.filter(u => u.company_id === company.id) || [];
      const traineeCount = companyUsers.filter(u => u.role === 'trainee').length;
      const adminCount = companyUsers.filter(u => u.role === 'company_admin').length;
      const activeUsers = companyUsers.filter(u => u.is_active).length;
      const utilizationRate = company.max_trainees > 0 ? (traineeCount / company.max_trainees) * 100 : 0;

      // Calculate health score based on multiple factors
      let healthScore = 0;
      
      // User activity factor (40% weight)
      const recentActiveUsers = companyUsers.filter(u => 
        u.last_login_at && new Date(u.last_login_at) > startDate
      ).length;
      const activityFactor = recentActiveUsers > 0 ? Math.min((recentActiveUsers / companyUsers.length) * 100, 100) : 0;
      healthScore += activityFactor * 0.4;

      // Utilization factor (30% weight)
      const utilizationFactor = Math.min(utilizationRate, 100);
      healthScore += utilizationFactor * 0.3;

      // Growth factor (20% weight)
      const recentUsers = companyUsers.filter(u => 
        new Date(u.created_at) > startDate
      ).length;
      const growthFactor = recentUsers > 0 ? Math.min((recentUsers / companyUsers.length) * 100, 100) : 0;
      healthScore += growthFactor * 0.2;

      // Admin presence factor (10% weight)
      const adminFactor = adminCount > 0 ? 100 : 0;
      healthScore += adminFactor * 0.1;

      // Calculate growth rate (simplified)
      const oldUsers = companyUsers.filter(u => 
        new Date(u.created_at) <= new Date(Date.now() - days * 24 * 60 * 60 * 1000)
      ).length;
      const growthRate = oldUsers > 0 ? ((companyUsers.length - oldUsers) / oldUsers) * 100 : 0;

      // Get last activity
      const lastLogin = companyUsers
        .filter(u => u.last_login_at)
        .sort((a, b) => new Date(b.last_login_at!).getTime() - new Date(a.last_login_at!).getTime())[0];
      
      const lastActivity = lastLogin?.last_login_at || company.created_at;

      return {
        companyId: company.id,
        companyName: company.name,
        healthScore: Math.round(healthScore),
        userCount: companyUsers.length,
        activeUsers,
        traineeCount,
        adminCount,
        lastActivity,
        growthRate: Math.round(growthRate * 10) / 10,
        activityTrend: Math.round(activityFactor),
        maxTrainees: company.max_trainees,
        utilizationRate: Math.round(utilizationRate * 10) / 10
      };
    });

    // Calculate overall metrics
    const totalCompanies = companies.length;
    const activeCompanies = companies.filter(c => c.is_active).length;
    const totalUsers = users?.length || 0;
    const totalTrainees = users?.filter(u => u.role === 'trainee').length || 0;
    const averageHealthScore = analytics.reduce((sum, a) => sum + a.healthScore, 0) / analytics.length || 0;
    const companiesAtCapacity = analytics.filter(a => a.utilizationRate >= 90).length;
    const inactiveCompanies = analytics.filter(a => a.healthScore < 60).length;

    // Calculate overall growth rate
    const oldCompanies = companies.filter(c => 
      new Date(c.created_at) <= new Date(Date.now() - days * 24 * 60 * 60 * 1000)
    ).length;
    const growthRate = oldCompanies > 0 ? ((totalCompanies - oldCompanies) / oldCompanies) * 100 : 0;

    const metrics = {
      totalCompanies,
      activeCompanies,
      totalUsers,
      totalTrainees,
      averageHealthScore: Math.round(averageHealthScore * 10) / 10,
      companiesAtCapacity,
      inactiveCompanies,
      growthRate: Math.round(growthRate * 10) / 10
    };

    // Generate time series data for charts
    const timeSeriesData = [];
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      const companiesOnDate = companies.filter(c => 
        new Date(c.created_at) <= date
      ).length;
      
      const usersOnDate = users?.filter(u => 
        new Date(u.created_at) <= date
      ).length || 0;
      
      const traineesOnDate = users?.filter(u => 
        u.role === 'trainee' && new Date(u.created_at) <= date
      ).length || 0;

      timeSeriesData.push({
        date: date.toISOString().split('T')[0],
        companies: companiesOnDate,
        users: usersOnDate,
        trainees: traineesOnDate
      });
    }

    return NextResponse.json({
      analytics,
      metrics,
      timeSeriesData
    });

  } catch (error) {
    console.error('Error in companies analytics API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
