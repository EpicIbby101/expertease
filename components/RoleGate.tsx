'use client';

import { useRole } from '@/lib/hooks/useRole';

interface RoleGateProps {
  children: React.ReactNode;
  requiredRole: 'trainee' | 'instructor' | 'admin';
  fallback?: React.ReactNode;
}

export function RoleGate({ children, requiredRole, fallback }: RoleGateProps) {
  const { hasAccess, isLoading } = useRole(requiredRole);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!hasAccess) {
    return fallback || <div>Access Denied</div>;
  }

  return <>{children}</>;
} 