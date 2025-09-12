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

    // Get companies with user data
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select(`
        id,
        name,
        slug,
        max_trainees,
        is_active,
        created_at
      `)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (companiesError) {
      console.error('Error fetching companies:', companiesError);
      return NextResponse.json({ error: 'Failed to fetch companies' }, { status: 500 });
    }

    // Get user data for all companies
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

    // Calculate health data for each company
    const healthData = companies.map(company => {
      const companyUsers = users?.filter(u => u.company_id === company.id) || [];
      const traineeCount = companyUsers.filter(u => u.role === 'trainee').length;
      const adminCount = companyUsers.filter(u => u.role === 'company_admin').length;
      const activeUsers = companyUsers.filter(u => u.is_active).length;
      
      // Calculate metrics
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      // User Engagement (based on recent logins)
      const recentActiveUsers = companyUsers.filter(u => 
        u.last_login_at && new Date(u.last_login_at) > oneWeekAgo
      ).length;
      const userEngagement = companyUsers.length > 0 ? (recentActiveUsers / companyUsers.length) * 100 : 0;
      
      // Activity Level (based on user creation in last month)
      const recentNewUsers = companyUsers.filter(u => 
        new Date(u.created_at) > oneMonthAgo
      ).length;
      const activityLevel = companyUsers.length > 0 ? (recentNewUsers / companyUsers.length) * 100 : 0;
      
      // Capacity Utilization
      const capacityUtilization = company.max_trainees > 0 ? (traineeCount / company.max_trainees) * 100 : 0;
      
      // Admin Presence
      const adminPresence = companyUsers.length > 0 ? (adminCount > 0 ? 100 : 0) : 0;
      
      // Recent Growth (users added in last month vs previous month)
      const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
      const previousMonthUsers = companyUsers.filter(u => 
        new Date(u.created_at) > twoMonthsAgo && new Date(u.created_at) <= oneMonthAgo
      ).length;
      const recentGrowth = previousMonthUsers > 0 ? 
        ((recentNewUsers - previousMonthUsers) / previousMonthUsers) * 100 : 
        (recentNewUsers > 0 ? 100 : 0);
      
      // Calculate overall health score
      const healthScore = Math.round(
        (userEngagement * 0.3) +
        (activityLevel * 0.2) +
        (capacityUtilization * 0.2) +
        (adminPresence * 0.2) +
        (Math.min(recentGrowth, 100) * 0.1)
      );
      
      // Determine status
      let status: 'excellent' | 'good' | 'warning' | 'critical';
      if (healthScore >= 80) status = 'excellent';
      else if (healthScore >= 60) status = 'good';
      else if (healthScore >= 40) status = 'warning';
      else status = 'critical';
      
      // Generate alerts
      const alerts = [];
      if (userEngagement < 30) {
        alerts.push({
          type: 'warning' as const,
          message: `Low user engagement: Only ${Math.round(userEngagement)}% of users have been active recently`,
          timestamp: now.toISOString()
        });
      }
      
      if (capacityUtilization >= 90) {
        alerts.push({
          type: 'warning' as const,
          message: `High capacity utilization: ${Math.round(capacityUtilization)}% of trainee slots are used`,
          timestamp: now.toISOString()
        });
      }
      
      if (capacityUtilization >= 100) {
        alerts.push({
          type: 'critical' as const,
          message: `Capacity exceeded: ${traineeCount} trainees exceed limit of ${company.max_trainees}`,
          timestamp: now.toISOString()
        });
      }
      
      if (adminCount === 0) {
        alerts.push({
          type: 'critical' as const,
          message: 'No company administrators assigned',
          timestamp: now.toISOString()
        });
      }
      
      if (companyUsers.length === 0) {
        alerts.push({
          type: 'warning' as const,
          message: 'No users assigned to this company',
          timestamp: now.toISOString()
        });
      }
      
      if (recentGrowth < -50) {
        alerts.push({
          type: 'warning' as const,
          message: `Significant decline in growth: ${Math.round(recentGrowth)}% decrease in new users`,
          timestamp: now.toISOString()
        });
      }
      
      // Generate recommendations
      const recommendations = [];
      if (userEngagement < 50) {
        recommendations.push('Consider implementing user engagement campaigns or training programs');
      }
      
      if (capacityUtilization >= 80) {
        recommendations.push('Consider increasing trainee capacity or optimizing user allocation');
      }
      
      if (adminCount === 0) {
        recommendations.push('Assign at least one company administrator to manage users');
      }
      
      if (companyUsers.length === 0) {
        recommendations.push('Invite users to join this company or review company setup');
      }
      
      if (activityLevel < 20) {
        recommendations.push('Review company onboarding process and user acquisition strategy');
      }
      
      if (healthScore < 60) {
        recommendations.push('Schedule a company health review meeting with stakeholders');
      }
      
      // Get last activity
      const lastLogin = companyUsers
        .filter(u => u.last_login_at)
        .sort((a, b) => new Date(b.last_login_at!).getTime() - new Date(a.last_login_at!).getTime())[0];
      
      const lastActivity = lastLogin?.last_login_at || company.created_at;
      
      return {
        companyId: company.id,
        companyName: company.name,
        healthScore,
        status,
        metrics: {
          userEngagement: Math.round(userEngagement * 10) / 10,
          activityLevel: Math.round(activityLevel * 10) / 10,
          capacityUtilization: Math.round(capacityUtilization * 10) / 10,
          adminPresence: Math.round(adminPresence * 10) / 10,
          recentGrowth: Math.round(recentGrowth * 10) / 10
        },
        alerts,
        lastActivity,
        recommendations
      };
    });

    return NextResponse.json({
      healthData: healthData.sort((a, b) => b.healthScore - a.healthScore) // Sort by health score descending
    });

  } catch (error) {
    console.error('Error in company health API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
