'use client';

import { useEffect, useState } from 'react';

export function useRole(requiredRole: 'site_admin' | 'company_admin' | 'trainee') {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const response = await fetch(`/api/check-role?role=${requiredRole}`);
        const { hasAccess } = await response.json();
        setHasAccess(hasAccess);
      } catch (error) {
        console.error('Error checking role:', error);
        setHasAccess(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAccess();
  }, [requiredRole]);

  return { hasAccess, isLoading };
} 