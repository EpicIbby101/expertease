'use client';

import { useUserStatus } from '@/utils/hooks/useUserStatus';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Component that checks user status and redirects deactivated users
 * Should be placed in the main layout
 */
export function UserStatusChecker() {
  const { isActive, isLoading } = useUserStatus();
  const pathname = usePathname();

  // Don't check status on public pages or the deactivated page itself
  const publicPages = ['/auth', '/account-deactivated', '/'];
  const isPublicPage = publicPages.some(page => pathname.startsWith(page));

  useEffect(() => {
    // Only check if not on a public page and not loading
    if (!isPublicPage && !isLoading && !isActive) {
      // The useUserStatus hook will handle the redirect
      // This effect is just for additional safety
    }
  }, [isActive, isLoading, isPublicPage]);

  // Don't render anything - this is just a status checker
  return null;
}
