import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';
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
      return NextResponse.json({ error: 'User not associated with a company' }, { status: 400 });
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

    // Get company trainees
    const { data: trainees, error: traineesError } = await supabase
      .from('users')
      .select(`
        id,
        email,
        first_name,
        last_name,
        phone,
        job_title,
        department,
        date_of_birth,
        role,
        is_active,
        created_at,
        last_active_at
      `)
      .eq('company_id', userCompany.company_id)
      .eq('role', 'trainee')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (traineesError) {
      console.error('Error fetching trainees:', traineesError);
      return NextResponse.json({ error: 'Failed to fetch trainees' }, { status: 500 });
    }

    // For now, we'll simulate performance data since we don't have course/training data yet
    // In a real implementation, you'd fetch from courses/training_progress tables
    
    const traineesWithPerformance = trainees?.map(trainee => {
      // Simulate realistic performance data
      const totalCourses = 4; // Total available courses
      const coursesCompleted = Math.floor(Math.random() * totalCourses) + 1;
      const completionRate = (coursesCompleted / totalCourses) * 100;
      
      // Simulate average score based on completion and engagement
      const baseScore = 70 + Math.random() * 25; // 70-95
      const completionBonus = completionRate > 75 ? 5 : 0;
      const averageScore = Math.min(100, baseScore + completionBonus);
      
      // Simulate engagement score based on recent activity
      const daysSinceLastLogin = trainee.last_active_at 
        ? Math.floor((new Date().getTime() - new Date(trainee.last_active_at).getTime()) / (1000 * 60 * 60 * 24))
        : 30;
      
      let engagementScore;
      if (daysSinceLastLogin <= 1) engagementScore = 90 + Math.random() * 10; // 90-100
      else if (daysSinceLastLogin <= 7) engagementScore = 70 + Math.random() * 20; // 70-90
      else if (daysSinceLastLogin <= 30) engagementScore = 40 + Math.random() * 30; // 40-70
      else engagementScore = 10 + Math.random() * 30; // 10-40

      return {
        ...trainee,
        completionRate: Math.round(completionRate * 10) / 10,
        averageScore: Math.round(averageScore * 10) / 10,
        coursesCompleted,
        totalCourses,
        engagementScore: Math.round(engagementScore * 10) / 10
      };
    }) || [];

    return NextResponse.json({
      trainees: traineesWithPerformance
    });

  } catch (error) {
    console.error('Error in company trainees API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
