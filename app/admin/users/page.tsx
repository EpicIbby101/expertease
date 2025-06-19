import { createClient } from '@supabase/supabase-js';
import { RoleGate } from '../../../components/RoleGate';
import { UserRoleManager } from '../../../components/UserRoleManager';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function AdminUsersPage() {
  const { data: users } = await supabase
    .from('users')
    .select('id, email, role, company_name')
    .order('created_at', { ascending: false });

  return (
    <RoleGate requiredRole="site_admin">
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">User Management</h1>
        <UserRoleManager users={users || []} />
      </div>
    </RoleGate>
  );
} 