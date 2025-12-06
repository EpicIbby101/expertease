import { RoleGate } from '../../../../components/RoleGate';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { 
  BookOpen, 
  Clock, 
  Users, 
  Star, 
  CheckCircle, 
  Play, 
  ArrowLeft, 
  Award,
  FileText,
  Video,
  FileQuestion,
  Target,
  Calendar
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';
import { notFound } from 'next/navigation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface Lesson {
  id: string;
  title: string;
  type: 'video' | 'reading' | 'quiz' | 'assignment';
  duration: number; // in minutes
  completed: boolean;
  order: number;
}

interface Course {
  id: string;
  title: string;
  description: string;
  fullDescription: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number; // in hours
  lessons: Lesson[];
  enrolledCount: number;
  rating: number;
  instructor: string;
  objectives: string[];
  prerequisites: string[];
  status: 'available' | 'enrolled' | 'completed' | 'in_progress';
  progress?: number;
  enrolledDate?: string;
  completedDate?: string;
}

async function getCourse(courseId: string, userId: string): Promise<Course | null> {
  try {
    // For now, simulate course data
    // In a real implementation, you'd fetch from:
    // - courses table (course details)
    // - course_lessons table (lessons for this course)
    // - course_enrollments table (user's enrollment status)
    // - course_progress table (user's progress per lesson)

    const courses: Record<string, Course> = {
      '1': {
        id: '1',
        title: 'Safety Training Fundamentals',
        description: 'Learn essential safety protocols and procedures for workplace safety.',
        fullDescription: 'This comprehensive safety training course covers all aspects of workplace safety, from hazard identification to emergency response. You will learn about safety equipment, proper procedures, and how to maintain a safe working environment. The course includes practical examples, case studies, and interactive exercises to reinforce your learning.',
        category: 'Safety',
        difficulty: 'beginner',
        duration: 4,
        instructor: 'Sarah Johnson',
        enrolledCount: 245,
        rating: 4.8,
        objectives: [
          'Identify common workplace hazards',
          'Understand emergency response procedures',
          'Learn proper use of safety equipment',
          'Develop safety inspection skills',
          'Create effective safety protocols'
        ],
        prerequisites: [
          'Basic understanding of workplace operations',
          'No prior safety training required'
        ],
        status: 'in_progress',
        progress: 65,
        enrolledDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        lessons: [
          { id: '1-1', title: 'Introduction to Workplace Safety', type: 'video', duration: 15, completed: true, order: 1 },
          { id: '1-2', title: 'Hazard Identification Basics', type: 'reading', duration: 20, completed: true, order: 2 },
          { id: '1-3', title: 'Hazard Identification Quiz', type: 'quiz', duration: 10, completed: true, order: 3 },
          { id: '1-4', title: 'Emergency Response Procedures', type: 'video', duration: 25, completed: true, order: 4 },
          { id: '1-5', title: 'Emergency Procedures Exercise', type: 'assignment', duration: 30, completed: false, order: 5 },
          { id: '1-6', title: 'Safety Equipment Overview', type: 'video', duration: 20, completed: false, order: 6 },
          { id: '1-7', title: 'Safety Equipment Usage Guide', type: 'reading', duration: 25, completed: false, order: 7 },
          { id: '1-8', title: 'Safety Equipment Quiz', type: 'quiz', duration: 15, completed: false, order: 8 },
          { id: '1-9', title: 'Safety Inspections', type: 'video', duration: 30, completed: false, order: 9 },
          { id: '1-10', title: 'Creating Safety Protocols', type: 'reading', duration: 20, completed: false, order: 10 },
          { id: '1-11', title: 'Protocol Development Exercise', type: 'assignment', duration: 45, completed: false, order: 11 },
          { id: '1-12', title: 'Final Assessment', type: 'quiz', duration: 30, completed: false, order: 12 }
        ]
      },
      '2': {
        id: '2',
        title: 'Equipment Handling & Maintenance',
        description: 'Comprehensive guide to proper equipment handling, maintenance procedures, and troubleshooting.',
        fullDescription: 'Master the art of equipment handling and maintenance with this detailed course. Learn proper techniques for operating various types of equipment, perform routine maintenance, troubleshoot common issues, and ensure equipment longevity. Includes hands-on exercises and real-world scenarios.',
        category: 'Operations',
        difficulty: 'intermediate',
        duration: 6,
        instructor: 'Michael Chen',
        enrolledCount: 189,
        rating: 4.6,
        objectives: [
          'Understand equipment operation procedures',
          'Learn preventive maintenance techniques',
          'Develop troubleshooting skills',
          'Master equipment safety protocols',
          'Implement maintenance schedules'
        ],
        prerequisites: [
          'Basic mechanical knowledge',
          'Completion of Safety Training Fundamentals recommended'
        ],
        status: 'enrolled',
        progress: 0,
        enrolledDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
        lessons: [
          { id: '2-1', title: 'Equipment Types and Classifications', type: 'video', duration: 20, completed: false, order: 1 },
          { id: '2-2', title: 'Operating Procedures', type: 'reading', duration: 30, completed: false, order: 2 },
          { id: '2-3', title: 'Basic Maintenance Concepts', type: 'video', duration: 25, completed: false, order: 3 },
          { id: '2-4', title: 'Preventive Maintenance Schedule', type: 'reading', duration: 35, completed: false, order: 4 },
          { id: '2-5', title: 'Maintenance Procedures Quiz', type: 'quiz', duration: 15, completed: false, order: 5 }
        ]
      },
      '3': {
        id: '3',
        title: 'Emergency Procedures & Response',
        description: 'Critical training on emergency procedures, evacuation protocols, first aid basics, and crisis management.',
        fullDescription: 'Be prepared for any emergency situation with this comprehensive training program. Learn evacuation procedures, first aid basics, crisis communication, and how to remain calm and effective during emergencies. This course is essential for workplace safety and compliance.',
        category: 'Safety',
        difficulty: 'beginner',
        duration: 3,
        instructor: 'Dr. Emily Rodriguez',
        enrolledCount: 312,
        rating: 4.9,
        objectives: [
          'Master evacuation procedures',
          'Learn basic first aid techniques',
          'Understand crisis communication',
          'Develop emergency response skills',
          'Practice emergency scenarios'
        ],
        prerequisites: [],
        status: 'completed',
        progress: 100,
        enrolledDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
        completedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        lessons: [
          { id: '3-1', title: 'Emergency Preparedness Overview', type: 'video', duration: 15, completed: true, order: 1 },
          { id: '3-2', title: 'Evacuation Procedures', type: 'video', duration: 20, completed: true, order: 2 },
          { id: '3-3', title: 'First Aid Basics', type: 'video', duration: 30, completed: true, order: 3 },
          { id: '3-4', title: 'CPR and AED Training', type: 'video', duration: 25, completed: true, order: 4 },
          { id: '3-5', title: 'First Aid Assessment', type: 'quiz', duration: 20, completed: true, order: 5 }
        ]
      },
      '4': {
        id: '4',
        title: 'Quality Standards & Compliance',
        description: 'Understand quality standards, compliance requirements, quality control procedures, and documentation best practices.',
        fullDescription: 'Navigate the complex world of quality standards and compliance with confidence. Learn about industry standards, regulatory requirements, quality control procedures, documentation practices, and how to maintain compliance in your organization.',
        category: 'Quality',
        difficulty: 'advanced',
        duration: 8,
        instructor: 'James Wilson',
        enrolledCount: 156,
        rating: 4.7,
        objectives: [
          'Understand quality standards framework',
          'Learn compliance requirements',
          'Master quality control procedures',
          'Develop documentation skills',
          'Implement quality management systems'
        ],
        prerequisites: [
          'Intermediate level understanding of operations',
          'Previous quality training recommended'
        ],
        status: 'available',
        lessons: [
          { id: '4-1', title: 'Quality Standards Overview', type: 'video', duration: 30, completed: false, order: 1 },
          { id: '4-2', title: 'Regulatory Requirements', type: 'reading', duration: 45, completed: false, order: 2 },
          { id: '4-3', title: 'Quality Control Methods', type: 'video', duration: 40, completed: false, order: 3 },
          { id: '4-4', title: 'Documentation Best Practices', type: 'reading', duration: 35, completed: false, order: 4 }
        ]
      },
      '5': {
        id: '5',
        title: 'Workplace Communication Skills',
        description: 'Improve your communication skills for better workplace collaboration, conflict resolution, and team effectiveness.',
        fullDescription: 'Enhance your professional communication skills with this comprehensive course. Learn effective verbal and written communication, active listening, conflict resolution, presentation skills, and how to build stronger workplace relationships.',
        category: 'Professional Development',
        difficulty: 'beginner',
        duration: 5,
        instructor: 'Lisa Anderson',
        enrolledCount: 298,
        rating: 4.5,
        objectives: [
          'Improve verbal communication',
          'Enhance written communication skills',
          'Master active listening',
          'Learn conflict resolution techniques',
          'Develop presentation skills'
        ],
        prerequisites: [],
        status: 'available',
        lessons: [
          { id: '5-1', title: 'Communication Fundamentals', type: 'video', duration: 20, completed: false, order: 1 },
          { id: '5-2', title: 'Active Listening Techniques', type: 'video', duration: 25, completed: false, order: 2 },
          { id: '5-3', title: 'Written Communication Best Practices', type: 'reading', duration: 30, completed: false, order: 3 }
        ]
      },
      '6': {
        id: '6',
        title: 'Data Analysis & Reporting',
        description: 'Learn to analyze data, create reports, and use analytical tools for informed decision-making.',
        fullDescription: 'Transform raw data into actionable insights with this data analysis course. Learn data collection methods, analysis techniques, visualization tools, report creation, and how to present findings effectively to stakeholders.',
        category: 'Skills',
        difficulty: 'intermediate',
        duration: 7,
        instructor: 'David Kim',
        enrolledCount: 201,
        rating: 4.6,
        objectives: [
          'Understand data collection methods',
          'Learn analysis techniques',
          'Master data visualization',
          'Create effective reports',
          'Present data findings'
        ],
        prerequisites: [
          'Basic Excel knowledge',
          'Familiarity with spreadsheets'
        ],
        status: 'available',
        lessons: [
          { id: '6-1', title: 'Data Collection Methods', type: 'video', duration: 30, completed: false, order: 1 },
          { id: '6-2', title: 'Data Analysis Fundamentals', type: 'reading', duration: 40, completed: false, order: 2 },
          { id: '6-3', title: 'Visualization Techniques', type: 'video', duration: 35, completed: false, order: 3 }
        ]
      }
    };

    return courses[courseId] || null;
  } catch (error) {
    console.error('Error fetching course:', error);
    return null;
  }
}

function getLessonIcon(type: string) {
  switch (type) {
    case 'video':
      return <Video className="h-4 w-4" />;
    case 'reading':
      return <FileText className="h-4 w-4" />;
    case 'quiz':
      return <FileQuestion className="h-4 w-4" />;
    case 'assignment':
      return <Target className="h-4 w-4" />;
    default:
      return <BookOpen className="h-4 w-4" />;
  }
}

function getLessonTypeLabel(type: string) {
  switch (type) {
    case 'video':
      return 'Video';
    case 'reading':
      return 'Reading';
    case 'quiz':
      return 'Quiz';
    case 'assignment':
      return 'Assignment';
    default:
      return 'Lesson';
  }
}

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { userId } = await auth();
  
  if (!userId) {
    return null;
  }

  const { id } = await params;
  const course = await getCourse(id, userId);

  if (!course) {
    notFound();
  }

  const completedLessons = course.lessons.filter(l => l.completed).length;
  const totalLessons = course.lessons.length;
  const currentLesson = course.lessons.find(l => !l.completed);

  return (
    <RoleGate requiredRole="trainee">
      <div className="space-y-6">
        {/* Back Button */}
        <Button asChild variant="ghost" className="mb-4">
          <Link href="/trainee/courses">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Courses
          </Link>
        </Button>

        {/* Course Header */}
        <div className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-lg p-6 border border-blue-200/20">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <Badge 
                  variant="outline"
                  className={
                    course.difficulty === 'beginner' ? 'bg-green-50 text-green-700 border-green-200' :
                    course.difficulty === 'intermediate' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                    'bg-purple-50 text-purple-700 border-purple-200'
                  }
                >
                  {course.difficulty.charAt(0).toUpperCase() + course.difficulty.slice(1)}
                </Badge>
                <Badge variant="outline">{course.category}</Badge>
                {course.status === 'completed' && (
                  <Badge className="bg-green-500">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Completed
                  </Badge>
                )}
                {course.status === 'in_progress' && (
                  <Badge className="bg-orange-500">
                    <Play className="h-3 w-3 mr-1" />
                    In Progress
                  </Badge>
                )}
                {course.status === 'enrolled' && (
                  <Badge variant="secondary">Enrolled</Badge>
                )}
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-3">{course.title}</h1>
              <p className="text-lg text-gray-600 mb-4">{course.description}</p>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{course.rating}</span>
                  <span>({course.enrolledCount} enrolled)</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{course.duration} hours</span>
                </div>
                <div className="flex items-center gap-1">
                  <BookOpen className="h-4 w-4" />
                  <span>{totalLessons} lessons</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>Instructor: {course.instructor}</span>
                </div>
              </div>
              {course.progress !== undefined && course.progress > 0 && (
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Overall Progress</span>
                    <span className="font-medium">{course.progress}%</span>
                  </div>
                  <Progress value={course.progress} className="h-3" />
                  <p className="text-xs text-gray-500">
                    {completedLessons} of {totalLessons} lessons completed
                  </p>
                </div>
              )}
            </div>
            <div className="lg:w-80">
              <Card>
                <CardHeader>
                  <CardTitle>Course Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {course.status === 'available' ? (
                    <Button className="w-full" size="lg">
                      Enroll in Course
                    </Button>
                  ) : course.status === 'in_progress' && currentLesson ? (
                    <Button asChild className="w-full" size="lg">
                      <Link href={`/trainee/courses/${course.id}/lessons/${currentLesson.id}`}>
                        <Play className="h-4 w-4 mr-2" />
                        Continue Learning
                      </Link>
                    </Button>
                  ) : course.status === 'in_progress' ? (
                    <Button asChild className="w-full" size="lg" variant="outline">
                      <Link href={`/trainee/courses/${course.id}/lessons/${course.lessons[0].id}`}>
                        Review Course
                      </Link>
                    </Button>
                  ) : course.status === 'completed' ? (
                    <Button asChild className="w-full" size="lg" variant="outline">
                      <Link href={`/trainee/courses/${course.id}/lessons/${course.lessons[0].id}`}>
                        Review Course
                      </Link>
                    </Button>
                  ) : (
                    <Button asChild className="w-full" size="lg">
                      <Link href={`/trainee/courses/${course.id}/lessons/${course.lessons[0].id}`}>
                        Start Course
                      </Link>
                    </Button>
                  )}
                  {course.status !== 'available' && course.enrolledDate && (
                    <div className="text-sm text-gray-600 pt-2 border-t">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>Enrolled {new Date(course.enrolledDate).toLocaleDateString()}</span>
                      </div>
                      {course.completedDate && (
                        <div className="flex items-center gap-2 mt-1">
                          <Award className="h-4 w-4 text-green-600" />
                          <span>Completed {new Date(course.completedDate).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Course Content */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {/* About Course */}
            <Card>
              <CardHeader>
                <CardTitle>About This Course</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-line">{course.fullDescription}</p>
              </CardContent>
            </Card>

            {/* Course Objectives */}
            <Card>
              <CardHeader>
                <CardTitle>Learning Objectives</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {course.objectives.map((objective, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Target className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{objective}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Prerequisites */}
            {course.prerequisites.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Prerequisites</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {course.prerequisites.map((prereq, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{prereq}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Course Curriculum */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Course Curriculum</CardTitle>
                <CardDescription>
                  {completedLessons} of {totalLessons} lessons completed
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {course.lessons.map((lesson, index) => (
                    <div key={lesson.id}>
                      <div className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                        lesson.completed 
                          ? 'bg-green-50 border border-green-200' 
                          : currentLesson?.id === lesson.id
                          ? 'bg-blue-50 border border-blue-200'
                          : 'hover:bg-gray-50 border border-transparent'
                      }`}>
                        <div className={`flex-shrink-0 ${
                          lesson.completed ? 'text-green-600' : 
                          currentLesson?.id === lesson.id ? 'text-blue-600' : 
                          'text-gray-400'
                        }`}>
                          {lesson.completed ? (
                            <CheckCircle className="h-5 w-5" />
                          ) : (
                            <div className="h-5 w-5 rounded-full border-2 border-current flex items-center justify-center">
                              <span className="text-xs font-medium">{lesson.order}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <div className={`${
                              lesson.completed ? 'text-green-600' : 
                              currentLesson?.id === lesson.id ? 'text-blue-600' : 
                              'text-gray-400'
                            }`}>
                              {getLessonIcon(lesson.type)}
                            </div>
                            <span className="text-xs text-gray-500">
                              {getLessonTypeLabel(lesson.type)}
                            </span>
                            <span className="text-xs text-gray-400">
                              {lesson.duration} min
                            </span>
                          </div>
                          <p className={`text-sm font-medium ${
                            lesson.completed || currentLesson?.id === lesson.id
                              ? 'text-gray-900'
                              : 'text-gray-600'
                          }`}>
                            {lesson.title}
                          </p>
                        </div>
                        {currentLesson?.id === lesson.id && !lesson.completed && (
                          <Play className="h-4 w-4 text-blue-600 flex-shrink-0" />
                        )}
                      </div>
                      {index < course.lessons.length - 1 && (
                        <Separator className="my-1" />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </RoleGate>
  );
}
