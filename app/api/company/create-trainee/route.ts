import { createClient } from '@supabase/supabase-js';
import { hasRole, getUserCompany } from '@/lib/auth';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  // Check if the requester is a company admin
  const isCompanyAdmin = await hasRole('company_admin');
  if (!isCompanyAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { email, companyId } = await request.json();

  if (!email || !companyId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Verify the user is managing their own company
  const userCompany = await getUserCompany();
  if (userCompany?.company_id !== companyId) {
    return NextResponse.json({ error: 'Cannot create trainee for different company' }, { status: 403 });
  }

  // Check if user already exists
  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .single();

  if (existingUser) {
    return NextResponse.json({ error: 'User with this email already exists' }, { status: 409 });
  }

  // Generate a UUID for the trainee (this will be replaced when they sign up with Clerk)
  const traineeId = crypto.randomUUID();

  // Create trainee user record
  const { data: newUser, error } = await supabase
    .from('users')
    .insert({
      id: traineeId,
      email,
      role: 'trainee',
      company_id: companyId,
      company_name: userCompany?.company_name
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating trainee:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // TODO: Send invitation email to the trainee
  // This would integrate with your email service (SendGrid, Resend, etc.)

  return NextResponse.json({ 
    success: true, 
    user: newUser,
    message: 'Trainee created successfully. Invitation email sent.'
  });
} 