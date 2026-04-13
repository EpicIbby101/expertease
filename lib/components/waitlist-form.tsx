'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
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
    <div className="w-full max-w-2xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-8"
      >
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 mb-6 shadow-lg shadow-green-500/20">
          <Sparkles className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
          Be the First to Know
        </h2>
        <p className="text-lg md:text-xl text-gray-400 max-w-xl mx-auto leading-relaxed">
          Join our waitlist and be notified when we launch..
        </p>
      </motion.div>

      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="flex flex-col gap-4"
      >
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Mail className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email address"
            required
            className="w-full pl-12 pr-4 py-4 bg-white/5 backdrop-blur-sm border border-green-500/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-all duration-300 disabled:opacity-50"
            disabled={status === 'loading'}
          />
        </div>
        
        <button
          type="submit"
          disabled={status === 'loading'}
          className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg shadow-green-500/20 hover:shadow-xl hover:shadow-green-500/30 transform hover:scale-[1.02] active:scale-[0.98] text-lg"
        >
          {status === 'loading' ? (
            <span className="flex items-center justify-center gap-2">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
              />
              Joining...
            </span>
          ) : (
            'Join Waitlist'
          )}
        </button>

        {status === 'success' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-2 p-4 bg-green-500/10 border border-green-500/30 rounded-lg"
          >
            <CheckCircle2 className="h-5 w-5 text-green-400" />
            <p className="text-green-400 font-medium">Thanks for joining! Check your email for confirmation.</p>
          </motion.div>
        )}
        
        {status === 'error' && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-2 p-4 bg-red-500/10 border border-red-500/30 rounded-lg"
          >
            <AlertCircle className="h-5 w-5 text-red-400" />
            <p className="text-red-400 font-medium">Something went wrong. Please try again.</p>
          </motion.div>
        )}
      </motion.form>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="text-sm text-gray-500 text-center mt-6"
      >
        We respect your privacy. Unsubscribe at any time.
      </motion.p>
    </div>
  );
}
