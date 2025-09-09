import { createClient } from '@supabase/supabase-js';
import { RoleGate } from '../../../components/RoleGate';
import { AuditLogsDashboard } from '../../../components/AuditLogsDashboard';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function AuditLogsPage() {
  // Fetch initial audit logs
  const { data: auditLogs, error } = await supabase
    .from('audit_logs')
    .select(`
      id,
      user_id,
      action,
      resource_type,
      resource_id,
      old_values,
      new_values,
      metadata,
      ip_address,
      user_agent,
      severity,
      category,
      created_at,
      users!audit_logs_user_id_fkey(
        first_name,
        last_name,
        email
      )
    `)
    .order('created_at', { ascending: false })
    .limit(50);

  // Get total count
  const { count: totalCount } = await supabase
    .from('audit_logs')
    .select('*', { count: 'exact', head: true });

  return (
    <RoleGate requiredRole="site_admin">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Audit Logs</h1>
            <p className="text-gray-600 mt-1">Comprehensive audit trail of all administrative actions and system events</p>
          </div>
        </div>

        {/* Audit Logs Dashboard */}
        <AuditLogsDashboard 
          initialLogs={auditLogs || []} 
          totalCount={totalCount || 0} 
        />
      </div>
    </RoleGate>
  );
}
