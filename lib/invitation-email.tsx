import * as React from 'react';
import { Html } from '@react-email/html';
import { Button } from '@react-email/button';
import { Text } from '@react-email/text';
import { Section } from '@react-email/section';

interface InvitationEmailProps {
  invitationUrl: string;
  firstName: string;
  lastName: string;
  role: string;
  companyName?: string;
  invitedBy?: string;
  expiresIn: string;
}

export function InvitationEmail({ 
  invitationUrl, 
  firstName, 
  lastName, 
  role, 
  companyName, 
  invitedBy, 
  expiresIn 
}: InvitationEmailProps) {
  const getRoleDisplay = (role: string) => {
    switch (role) {
      case 'site_admin':
        return 'Site Administrator';
      case 'company_admin':
        return 'Company Administrator';
      case 'trainee':
        return 'Trainee';
      default:
        return role;
    }
  };

  return React.createElement(
    Html,
    { lang: 'en' },
    React.createElement(
      Section,
      { style: { padding: '20px', textAlign: 'center', fontFamily: 'Arial, sans-serif' } },
      React.createElement(
        Text,
        { style: { fontSize: '24px', color: '#1f2937', fontWeight: 'bold', marginBottom: '16px' } },
        `Welcome to Expert Ease, ${firstName}!`
      ),
      React.createElement(
        Text,
        { style: { fontSize: '16px', color: '#4b5563', marginBottom: '16px' } },
        `You've been invited to join Expert Ease as a ${getRoleDisplay(role)}.`
      ),
      companyName && React.createElement(
        Text,
        { style: { fontSize: '16px', color: '#4b5563', marginBottom: '16px' } },
        `Company: ${companyName}`
      ),
      invitedBy && React.createElement(
        Text,
        { style: { fontSize: '14px', color: '#6b7280', marginBottom: '24px' } },
        `Invited by: ${invitedBy}`
      ),
      React.createElement(
        Text,
        { style: { fontSize: '16px', color: '#4b5563', marginBottom: '24px' } },
        'Click the button below to accept your invitation and set up your account:'
      ),
      React.createElement(
        Button,
        {
          href: invitationUrl,
          style: {
            background: '#3b82f6',
            color: '#ffffff',
            padding: '14px 28px',
            borderRadius: '8px',
            textDecoration: 'none',
            fontSize: '16px',
            fontWeight: 'bold',
            display: 'inline-block',
            marginBottom: '24px',
          },
        },
        'Accept Invitation'
      ),
      React.createElement(
        Text,
        { style: { fontSize: '14px', color: '#6b7280', marginBottom: '16px' } },
        `This invitation expires in ${expiresIn}.`
      ),
      React.createElement(
        Text,
        { style: { fontSize: '14px', color: '#6b7280' } },
        "If you didn't expect this invitation, you can safely ignore this email."
      )
    )
  );
} 