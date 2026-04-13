import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';

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

    // Get user details and verify they're a trainee
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, first_name, last_name, role, company_id, company_name, created_at, last_active_at')
      .eq('user_id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.role !== 'trainee') {
      return NextResponse.json({ error: 'Forbidden - Trainee access required' }, { status: 403 });
    }

    // For now, we'll simulate course data since we don't have a courses/training_progress table yet
    // In a real implementation, you'd fetch from:
    // - courses table (to get available courses)
    // - course_enrollments table (to get enrolled courses)
    // - course_progress table (to get progress per course)
    // - course_assessments table (to get scores)

    // Simulate realistic trainee statistics
    const enrolledCourses = 4; // Total enrolled
    const completedCourses = Math.floor(Math.random() * enrolledCourses) + 1; // 1-4
    const inProgressCourses = enrolledCourses - completedCourses;
    
    // Simulate average score based on completion
    const baseScore = 70 + Math.random() * 25; // 70-95
    const completionBonus = (completedCourses / enrolledCourses) > 0.75 ? 5 : 0;
    const averageScore = Math.min(100, Math.round((baseScore + completionBonus) * 10) / 10);

    // Simulate course progress
    const courseProgress = [
      {
        courseId: '1',
        courseName: 'Safety Training',
        progress: completedCourses >= 1 ? 100 : completedCourses === 0 ? Math.floor(Math.random() * 80) + 10 : 0,
        status: completedCourses >= 1 ? 'completed' : 'in_progress',
        score: completedCourses >= 1 ? Math.round((80 + Math.random() * 15) * 10) / 10 : null,
        enrolledDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        completedDate: completedCourses >= 1 ? new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() : null
      },
      {
        courseId: '2',
        courseName: 'Equipment Handling',
        progress: completedCourses >= 2 ? 100 : completedCourses === 1 ? Math.floor(Math.random() * 80) + 10 : 0,
        status: completedCourses >= 2 ? 'completed' : completedCourses >= 1 ? 'in_progress' : 'not_started',
        score: completedCourses >= 2 ? Math.round((75 + Math.random() * 20) * 10) / 10 : null,
        enrolledDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
        completedDate: completedCourses >= 2 ? new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() : null
      },
      {
        courseId: '3',
        courseName: 'Emergency Procedures',
        progress: completedCourses >= 3 ? 100 : completedCourses >= 2 ? Math.floor(Math.random() * 80) + 10 : 0,
        status: completedCourses >= 3 ? 'completed' : completedCourses >= 2 ? 'in_progress' : 'not_started',
        score: completedCourses >= 3 ? Math.round((85 + Math.random() * 15) * 10) / 10 : null,
        enrolledDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
        completedDate: completedCourses >= 3 ? new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() : null
      },
      {
        courseId: '4',
        courseName: 'Quality Standards',
        progress: completedCourses >= 4 ? 100 : completedCourses >= 3 ? Math.floor(Math.random() * 80) + 10 : 0,
        status: completedCourses >= 4 ? 'completed' : completedCourses >= 3 ? 'in_progress' : 'not_started',
        score: completedCourses >= 4 ? Math.round((78 + Math.random() * 20) * 10) / 10 : null,
        enrolledDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        completedDate: completedCourses >= 4 ? new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() : null
      }
    ].slice(0, enrolledCourses);

    // Calculate overall completion rate
    const overallCompletionRate = enrolledCourses > 0 
      ? Math.round((completedCourses / enrolledCourses) * 100 * 10) / 10
      : 0;

    // Calculate engagement score based on recent activity
    const daysSinceLastLogin = user.last_active_at 
      ? Math.floor((new Date().getTime() - new Date(user.last_active_at).getTime()) / (1000 * 60 * 60 * 24))
      : 30;
    
    let engagementScore;
    if (daysSinceLastLogin <= 1) engagementScore = 90 + Math.random() * 10; // 90-100
    else if (daysSinceLastLogin <= 7) engagementScore = 70 + Math.random() * 20; // 70-90
    else if (daysSinceLastLogin <= 30) engagementScore = 40 + Math.random() * 30; // 40-70
    else engagementScore = 10 + Math.random() * 30; // 10-40

    return NextResponse.json({
      stats: {
        enrolledCourses,
        completedCourses,
        inProgressCourses,
        averageScore,
        overallCompletionRate,
        engagementScore: Math.round(engagementScore * 10) / 10
      },
      courseProgress,
      user: {
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        companyName: user.company_name
      }
    });

  } catch (error) {
    console.error('Error in trainee stats API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
