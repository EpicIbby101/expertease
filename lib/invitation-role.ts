export type AppRole = 'site_admin' | 'company_admin' | 'trainee';

export function normalizeInviteEmail(email: string | undefined | null): string {
  return (email ?? '').trim().toLowerCase();
}

export function isAppRole(value: unknown): value is AppRole {
  return value === 'site_admin' || value === 'company_admin' || value === 'trainee';
}
