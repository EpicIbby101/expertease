import Plunk from '@plunk/node';
import { render } from '@react-email/render';
import * as React from 'react';
import { Email } from './email';

const plunk = new Plunk(process.env.PLUNK_API_KEY || '');

interface SendEmailParams {
  to: string;
  subject: string;
  url: string;
}

export async function sendEmail({ to, subject, url }: SendEmailParams) {
  try {
    if (!process.env.PLUNK_API_KEY) {
      console.error('Missing PLUNK_API_KEY environment variable');
      return { success: false, error: 'Missing API key' };
    }

    const emailComponent = React.createElement(Email, { url });
    const htmlBody = await render(emailComponent);

    const result = await plunk.emails.send({
      to,
      subject,
      body: htmlBody,
    });

    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to send email:', error);
    return { success: false, error };
  }
}
