import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import Plunk from '@plunk/node';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const plunk = new Plunk(process.env.PLUNK_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user details and verify they're a trainee
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, first_name, last_name, role, company_id, company_name')
      .eq('user_id', userId)
      .single();

    if (userError || !user || user.role !== 'trainee') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { category, priority, subject, message, companyAdminEmail } = body;

    // Validate required fields
    if (!category || !subject || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Determine recipients - all tickets go to company admin only
    const recipients: string[] = [];
    
    // All tickets are sent to the company admin
    if (companyAdminEmail) {
      recipients.push(companyAdminEmail);
    } else {
      // Fallback: if no company admin found, log error but don't fail
      console.error('No company admin email found for user:', user.email);
    }

    // Create email content
    const priorityLabels: Record<string, string> = {
      low: 'Normal',
      medium: 'Important',
      high: 'Urgent'
    };

    const categoryLabels: Record<string, string> = {
      course: 'Course Question',
      technical: 'Technical Issue',
      account: 'Account Help',
      access: 'Access Request',
      other: 'Other'
    };

    const emailSubject = `[${priorityLabels[priority] || 'Medium'}] Support Request: ${subject}`;
    
    const emailBody = `
New Support Ticket Submitted

Category: ${categoryLabels[category] || category}
Priority: ${priorityLabels[priority] || 'Medium'}
Subject: ${subject}

Message:
${message}

---
User Information:
Name: ${user.first_name} ${user.last_name || ''}
Email: ${user.email}
Company: ${user.company_name || 'N/A'}

Submitted: ${new Date().toLocaleString()}
    `;

    // Send email notifications
    try {
      if (process.env.PLUNK_API_KEY) {
        // Send to all recipients
        await Promise.all(
          recipients.map(recipient => 
            plunk.emails.send({
              to: recipient,
              subject: emailSubject,
              body: emailBody,
            })
          )
        );
      } else {
        console.warn('PLUNK_API_KEY not set, skipping email notification');
      }
    } catch (emailError) {
      console.error('Error sending support email:', emailError);
      // Don't fail the request if email fails, but log it
    }

    // Store ticket in database
    const ticketNumber = `TKT-${Date.now()}`;
    const { data: ticket, error: ticketError } = await supabase
      .from('support_tickets')
      .insert({
        ticket_number: ticketNumber,
        user_id: user.id,
        user_email: user.email,
        user_name: `${user.first_name} ${user.last_name || ''}`.trim(),
        company_id: user.company_id || null,
        company_name: user.company_name || null,
        category,
        priority,
        subject,
        message,
        status: 'open',
        assigned_to_email: recipients[0] || null, // First recipient is primary assignee
      })
      .select()
      .single();

    if (ticketError) {
      console.error('Error storing ticket in database:', ticketError);
      // Continue anyway - email was sent
    }

    // Send confirmation email to user
    try {
      if (process.env.PLUNK_API_KEY) {
        await plunk.emails.send({
          to: user.email,
          subject: 'Support Request Received - Expert Ease',
          body: `
Thank you for contacting Expert Ease support!

We've received your support request and will get back to you soon.

Your Request Details:
Category: ${categoryLabels[category] || category}
Priority: ${priorityLabels[priority] || 'Medium'}
Subject: ${subject}

Your Message:
${message}

We aim to respond within:
- Urgent issues: 4 hours
- General inquiries: 24 hours
- Course questions: 48 hours

If you have any additional information, please reply to this email.

Best regards,
Expert Ease Support Team
          `,
        });
      }
    } catch (confirmError) {
      console.error('Error sending confirmation email:', confirmError);
      // Don't fail the request
    }

    return NextResponse.json(
      { 
        message: 'Support ticket submitted successfully',
        ticketId: ticket?.id || null,
        ticketNumber: ticket?.ticket_number || ticketNumber
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Support ticket API error:', error);
    return NextResponse.json(
      { error: 'Failed to submit support ticket' },
      { status: 500 }
    );
  }
}
