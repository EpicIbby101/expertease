import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth, currentUser } from '@clerk/nextjs/server';
import { getUserCompany } from '@/lib/auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's company
    const userCompany = await getUserCompany();
    
    if (!userCompany?.company_id) {
      return NextResponse.json({ 
        error: 'User not associated with a company',
        details: 'Please contact your administrator to assign you to a company.'
      }, { status: 400 });
    }

    // Check if user is company admin
    const { data: user } = await supabase
      .from('users')
      .select('role')
      .eq('user_id', userId)
      .single();

    if (!user || user.role !== 'company_admin') {
      return NextResponse.json({ error: 'Forbidden - Company admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '30';
    const days = parseInt(timeRange);

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    // Get company trainees
    const { data: trainees, error: traineesError } = await supabase
      .from('users')
      .select(`
        id,
        email,
        first_name,
        last_name,
        role,
        is_active,
        created_at,
        last_active_at
      `)
      .eq('company_id', userCompany.company_id)
      .eq('role', 'trainee')
      .is('deleted_at', null);

    if (traineesError) {
      console.error('Error fetching trainees:', traineesError);
      console.error('Company ID:', userCompany.company_id);
      console.error('User ID:', userId);
      return NextResponse.json({ 
        error: 'Failed to fetch trainees',
        details: traineesError.message 
      }, { status: 500 });
    }

    // For now, we'll simulate course data since we don't have a courses table yet
    // In a real implementation, you'd fetch from a courses/training_progress table
    
    const totalTrainees = trainees?.length || 0;
    const activeTrainees = trainees?.filter(t => t.is_active).length || 0;
    
    // Simulate course progress data
    const courseProgress = [
      {
        courseId: '1',
        courseName: 'Safety Training',
        totalTrainees: totalTrainees,
        completedTrainees: Math.floor(totalTrainees * 0.8),
        averageScore: 85.5,
        completionRate: 80
      },
      {
        courseId: '2',
        courseName: 'Equipment Handling',
        totalTrainees: totalTrainees,
        completedTrainees: Math.floor(totalTrainees * 0.6),
        averageScore: 78.2,
        completionRate: 60
      },
      {
        courseId: '3',
        courseName: 'Emergency Procedures',
        totalTrainees: totalTrainees,
        completedTrainees: Math.floor(totalTrainees * 0.9),
        averageScore: 92.1,
        completionRate: 90
      },
      {
        courseId: '4',
        courseName: 'Quality Standards',
        totalTrainees: totalTrainees,
        completedTrainees: Math.floor(totalTrainees * 0.4),
        averageScore: 76.8,
        completionRate: 40
      }
    ];

    // Simulate trainee activity over time
    const traineeActivity = [];
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      // Simulate realistic activity patterns
      const baseActivity = Math.floor(totalTrainees * 0.3);
      const weekendMultiplier = [0, 6].includes(date.getDay()) ? 0.3 : 1;
      const randomVariation = Math.random() * 0.4 + 0.8; // 0.8 to 1.2
      
      traineeActivity.push({
        date: date.toISOString().split('T')[0],
        activeUsers: Math.floor(baseActivity * weekendMultiplier * randomVariation),
        completedLessons: Math.floor(baseActivity * weekendMultiplier * randomVariation * 0.6),
        newRegistrations: i === 0 ? 0 : Math.floor(Math.random() * 3) // Random new registrations
      });
    }

    // Simulate trainee performance data
    const traineePerformance = trainees?.map(trainee => {
      const totalCourses = 4;
      const completedCourses = Math.floor(Math.random() * totalCourses) + 1;
      const averageScore = Math.random() * 30 + 70; // 70-100
      const engagementScore = Math.random() * 40 + 60; // 60-100
      
      return {
        traineeId: trainee.id,
        traineeName: `${trainee.first_name || ''} ${trainee.last_name || ''}`.trim() || trainee.email,
        totalCourses,
        completedCourses,
        averageScore: Math.round(averageScore * 10) / 10,
        lastActivity: trainee.last_active_at || trainee.created_at,
        engagementScore: Math.round(engagementScore * 10) / 10
      };
    }).sort((a, b) => b.averageScore - a.averageScore) || [];

    // Calculate overall metrics
    const completedCourses = courseProgress.reduce((sum, course) => sum + course.completedTrainees, 0);
    const averageScore = courseProgress.length > 0 ? 
      courseProgress.reduce((sum, course) => sum + course.averageScore, 0) / courseProgress.length : 0;
    
    // Calculate trainee engagement (based on recent activity)
    const recentActiveTrainees = trainees?.filter(t => 
      t.last_active_at && new Date(t.last_active_at) > startDate
    ).length || 0;
    const traineeEngagement = totalTrainees > 0 ? (recentActiveTrainees / totalTrainees) * 100 : 0;

    const analytics = {
      totalTrainees,
      activeTrainees,
      completedCourses,
      averageScore: Math.round(averageScore * 10) / 10,
      traineeEngagement: Math.round(traineeEngagement * 10) / 10,
      courseProgress,
      traineeActivity,
      traineePerformance
    };

    return NextResponse.json({
      analytics
    });

  } catch (error) {
    console.error('Error in company analytics API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
