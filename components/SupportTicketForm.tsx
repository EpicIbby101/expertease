'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Loader2, Send } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface SupportTicketFormProps {
  userEmail: string;
  userName: string;
  companyName: string;
  companyAdminEmail?: string | null;
}

export default function SupportTicketForm({ 
  userEmail, 
  userName, 
  companyName,
  companyAdminEmail 
}: SupportTicketFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [ticketNumber, setTicketNumber] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    category: '',
    priority: 'medium',
    subject: '',
    message: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.category || !formData.subject || !formData.message) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/trainee/support', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          userEmail,
          userName,
          companyName,
          companyAdminEmail
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit support ticket');
      }

      const result = await response.json();
      setTicketNumber(result.ticketNumber || null);
      setIsSuccess(true);
      toast.success(`Support ticket submitted successfully! Ticket #${result.ticketNumber || 'submitted'}`);
      
      // Reset form
      setFormData({
        category: '',
        priority: 'medium',
        subject: '',
        message: ''
      });

      // Reset success state after 5 seconds
      setTimeout(() => {
        setIsSuccess(false);
        setTicketNumber(null);
      }, 5000);
    } catch (error) {
      console.error('Error submitting support ticket:', error);
      toast.error('Failed to submit support ticket. Please try again or contact support directly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Ticket Submitted! ✅</h3>
        {ticketNumber && (
          <p className="text-sm font-medium text-gray-700 mb-2">
            Ticket Number: <span className="text-blue-600">{ticketNumber}</span>
          </p>
        )}
        <p className="text-gray-600 mb-4">
          We've received your support request and will get back to you soon.
        </p>
        <div className="flex gap-3 justify-center">
          <Link href="/trainee/support/tickets">
            <Button variant="default" className="gap-2">
              View My Tickets
            </Button>
          </Link>
          <Button 
            onClick={() => {
              setIsSuccess(false);
              setTicketNumber(null);
            }} 
            variant="outline"
            className="gap-2"
          >
            Submit Another Request
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="category" className="text-sm font-medium text-gray-700">
            Category <span className="text-red-500">*</span>
          </Label>
          <Select
            value={formData.category}
            onValueChange={(value) => setFormData({ ...formData, category: value })}
          >
            <SelectTrigger id="category" className="w-full">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="course">📚 Course Question</SelectItem>
              <SelectItem value="technical">🐛 Technical Issue</SelectItem>
              <SelectItem value="account">⚙️ Account Help</SelectItem>
              <SelectItem value="access">🔐 Access Request</SelectItem>
              <SelectItem value="other">💬 Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="priority" className="text-sm font-medium text-gray-700">
            Priority
          </Label>
          <Select
            value={formData.priority}
            onValueChange={(value) => setFormData({ ...formData, priority: value })}
          >
            <SelectTrigger id="priority" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">
                <div className="flex items-center gap-2">
                  <span>Low</span>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    Normal
                  </Badge>
                </div>
              </SelectItem>
              <SelectItem value="medium">
                <div className="flex items-center gap-2">
                  <span>Medium</span>
                  <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                    Important
                  </Badge>
                </div>
              </SelectItem>
              <SelectItem value="high">
                <div className="flex items-center gap-2">
                  <span>High</span>
                  <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                    Urgent
                  </Badge>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="subject" className="text-sm font-medium text-gray-700">
          Subject <span className="text-red-500">*</span>
        </Label>
        <Input
          id="subject"
          placeholder="Brief description of your issue..."
          value={formData.subject}
          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
          className="w-full"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="message" className="text-sm font-medium text-gray-700">
          Message <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="message"
          placeholder="Please provide as much detail as possible about your question or issue..."
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          className="w-full min-h-[150px]"
          required
        />
        <p className="text-xs text-gray-500">
          Include specific details like course names, error messages, or steps to reproduce the issue
        </p>
      </div>

      <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-blue-800">
          <p className="font-medium mb-1">Tip for Faster Response</p>
          <p className="text-blue-700">
            Providing detailed information helps us resolve your issue more quickly. 
            {formData.category === 'technical' && ' For technical issues, please include screenshots if possible.'}
          </p>
        </div>
      </div>

      <Button 
        type="submit" 
        className="w-full gap-2" 
        size="lg"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Submitting...
          </>
        ) : (
          <>
            <Send className="h-4 w-4" />
            Submit Support Request
          </>
        )}
      </Button>
    </form>
  );
}
