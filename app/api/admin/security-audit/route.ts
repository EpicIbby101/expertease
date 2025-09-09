import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // Get all users for analysis
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, first_name, last_name, role, is_active, created_at, last_sign_in_at')
      .order('created_at', { ascending: false });

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    // Get audit logs for activity analysis
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: auditLogs } = await supabase
      .from('audit_logs')
      .select('user_id, action, created_at')
      .gte('created_at', thirtyDaysAgo);

    // Analyze users for security issues
    const issues = analyzeUsersForSecurityIssues(users || [], auditLogs || []);
    
    // Calculate metrics
    const metrics = calculateSecurityMetrics(users || [], issues);

    return NextResponse.json({
      issues,
      metrics
    });

  } catch (error) {
    console.error('Security audit API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function analyzeUsersForSecurityIssues(users: any[], auditLogs: any[]): any[] {
  const issues: any[] = [];
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  users.forEach(user => {
    const userCreatedAt = new Date(user.created_at);
    const lastSignIn = user.last_sign_in_at ? new Date(user.last_sign_in_at) : null;
    
    // Check for inactive accounts (no sign-in in 30+ days)
    if (lastSignIn && lastSignIn < thirtyDaysAgo) {
      issues.push({
        id: `inactive_${user.id}`,
        type: 'inactive_account',
        severity: 'medium',
        title: 'Inactive User Account',
        description: `User has not signed in for ${Math.floor((now.getTime() - lastSignIn.getTime()) / (1000 * 60 * 60 * 24))} days`,
        userId: user.id,
        userName: `${user.first_name} ${user.last_name}`,
        userEmail: user.email,
        detectedAt: now.toISOString(),
        resolved: false,
        metadata: {
          lastSignIn: lastSignIn.toISOString(),
          daysInactive: Math.floor((now.getTime() - lastSignIn.getTime()) / (1000 * 60 * 60 * 24))
        }
      });
    }

    // Check for weak passwords (simplified - users with very old accounts and no recent activity)
    if (userCreatedAt < new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000) && 
        (!lastSignIn || lastSignIn < sevenDaysAgo)) {
      issues.push({
        id: `weak_password_${user.id}`,
        type: 'weak_password',
        severity: 'high',
        title: 'Potential Weak Password',
        description: 'User account may have weak password based on account age and activity patterns',
        userId: user.id,
        userName: `${user.first_name} ${user.last_name}`,
        userEmail: user.email,
        detectedAt: now.toISOString(),
        resolved: false,
        metadata: {
          accountAge: Math.floor((now.getTime() - userCreatedAt.getTime()) / (1000 * 60 * 60 * 24)),
          lastActivity: lastSignIn?.toISOString() || 'Never'
        }
      });
    }

    // Check for privilege escalation (users with admin roles created recently)
    if (user.role === 'site_admin' && userCreatedAt > new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)) {
      issues.push({
        id: `privilege_escalation_${user.id}`,
        type: 'privilege_escalation',
        severity: 'critical',
        title: 'Recent Admin Role Assignment',
        description: 'User was granted site admin privileges recently - verify authorization',
        userId: user.id,
        userName: `${user.first_name} ${user.last_name}`,
        userEmail: user.email,
        detectedAt: now.toISOString(),
        resolved: false,
        metadata: {
          role: user.role,
          assignedAt: userCreatedAt.toISOString(),
          daysSinceAssignment: Math.floor((now.getTime() - userCreatedAt.getTime()) / (1000 * 60 * 60 * 24))
        }
      });
    }

    // Check for suspicious activity patterns
    const userAuditLogs = auditLogs.filter(log => log.user_id === user.id);
    if (userAuditLogs.length > 50) { // High activity threshold
      const recentActivity = userAuditLogs.filter(log => 
        new Date(log.created_at) > sevenDaysAgo
      ).length;
      
      if (recentActivity > 20) {
        issues.push({
          id: `suspicious_activity_${user.id}`,
          type: 'suspicious_activity',
          severity: 'high',
          title: 'High Activity Pattern',
          description: `User has performed ${recentActivity} actions in the last 7 days`,
          userId: user.id,
          userName: `${user.first_name} ${user.last_name}`,
          userEmail: user.email,
          detectedAt: now.toISOString(),
          resolved: false,
          metadata: {
            recentActivity,
            totalActivity: userAuditLogs.length,
            period: '7 days'
          }
        });
      }
    }
  });

  return issues;
}

function calculateSecurityMetrics(users: any[], issues: any[]) {
  const totalUsers = users.length;
  const activeUsers = users.filter(user => user.is_active).length;
  const inactiveUsers = totalUsers - activeUsers;
  
  const totalIssues = issues.length;
  const criticalIssues = issues.filter(issue => issue.severity === 'critical').length;
  const highIssues = issues.filter(issue => issue.severity === 'high').length;
  const mediumIssues = issues.filter(issue => issue.severity === 'medium').length;
  const lowIssues = issues.filter(issue => issue.severity === 'low').length;
  const resolvedIssues = issues.filter(issue => issue.resolved).length;
  
  const weakPasswords = issues.filter(issue => issue.type === 'weak_password').length;
  const suspiciousActivities = issues.filter(issue => issue.type === 'suspicious_activity').length;

  return {
    totalIssues,
    criticalIssues,
    highIssues,
    mediumIssues,
    lowIssues,
    resolvedIssues,
    activeUsers,
    inactiveUsers,
    weakPasswords,
    suspiciousActivities
  };
}
