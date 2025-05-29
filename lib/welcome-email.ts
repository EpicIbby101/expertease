import * as React from 'react';
import { Html } from '@react-email/html';
import { Button } from '@react-email/button';
import { Text } from '@react-email/text';
import { Section } from '@react-email/section';

interface WelcomeEmailProps {
  url: string;
  firstName?: string;
}

export function WelcomeEmail({ url, firstName }: WelcomeEmailProps) {
  return React.createElement(
    Html,
    { lang: 'en' },
    React.createElement(
      Section,
      { style: { padding: '20px', textAlign: 'center' } },
      React.createElement(
        Text,
        { style: { fontSize: '24px', fontWeight: 'bold', color: '#333', marginBottom: '12px' } },
        `Welcome${firstName ? `, ${firstName}` : ''}!`
      ),
      React.createElement(
        Text,
        { style: { fontSize: '16px', color: '#666', lineHeight: '1.5' } },
        "Thank you for signing up. We're excited to have you on board."
      ),
      React.createElement(
        Text,
        { style: { color: '#666', marginBottom: '16px' } },
        "Your account has been successfully created and you can now access all our features."
      ),
      React.createElement(
        Button,
        {
          href: url,
          style: {
            background: '#3b82f6',
            color: '#fff',
            padding: '12px 20px',
            borderRadius: '6px',
            textDecoration: 'none',
            marginTop: '16px',
            fontWeight: 'bold',
          },
        },
        'Visit Dashboard'
      )
    )
  );
} 