'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface UserStatus {
  isActive: boolean;
  isLoading: boolean;
  error?: string;
}

/**
 * Hook to check if the current user is active
 * Automatically redirects deactivated users to a deactivated page
 */
export function useUserStatus() {
  const { userId, isLoaded } = useAuth();
  const router = useRouter();
  const [status, setStatus] = useState<UserStatus>({
    isActive: true,
    isLoading: true
  });

  useEffect(() => {
    if (!isLoaded || !userId) {
      setStatus({ isActive: false, isLoading: false });
      return;
    }

    const checkUserStatus = async () => {
      try {
        const response = await fetch('/api/auth/check-status');
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to check user status');
        }

        if (!data.isActive) {
          setStatus({ 
            isActive: false, 
            isLoading: false, 
            error: data.error 
          });
          
          // Show error message
          toast.error(data.error || 'Your account has been deactivated');
          
          // Redirect to deactivated page
          router.push('/account-deactivated');
          return;
        }

        setStatus({ isActive: true, isLoading: false });
      } catch (error) {
        console.error('Error checking user status:', error);
        setStatus({ 
          isActive: false, 
          isLoading: false, 
          error: 'Failed to check account status' 
        });
      }
    };

    checkUserStatus();
  }, [isLoaded, userId, router]);

  return status;
}
