'use client';

import { useState } from 'react';
import config from '@/config';

export function WaitlistForm() {
  if (!config.email.enabled) {
    return null;
  }

  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');

    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) throw new Error('Failed to join waitlist');

      setStatus('success');
      setEmail('');
    } catch (error) {
      setStatus('error');
      console.error('Failed to join waitlist:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-md mx-auto">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email"
        required
        className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        disabled={status === 'loading'}
      />
      <button
        type="submit"
        disabled={status === 'loading'}
        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
      >
        {status === 'loading' ? 'Joining...' : 'Join Waitlist'}
      </button>

      {status === 'success' && (
        <p className="text-green-500 text-center">Thanks for joining! Check your email.</p>
      )}
      {status === 'error' && (
        <p className="text-red-500 text-center">Something went wrong. Please try again.</p>
      )}
    </form>
  );
}
