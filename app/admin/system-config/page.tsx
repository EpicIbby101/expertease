import { createClient } from '@supabase/supabase-js';
import { RoleGate } from '../../../components/RoleGate';
import { SystemConfigDashboard } from '../../../components/SystemConfigDashboard';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function SystemConfigPage() {
  // Fetch all system configurations
  const { data: configs, error } = await supabase
    .from('system_config')
    .select('*')
    .order('category, key');

  if (error) {
    console.error('Error fetching system configs:', error);
  }

  return (
    <RoleGate requiredRole="site_admin">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">System Configuration</h1>
            <p className="text-gray-600 mt-1">Manage platform-wide settings, security options, and feature flags</p>
          </div>
        </div>

        {/* System Configuration Dashboard */}
        <SystemConfigDashboard initialConfigs={configs || []} />
      </div>
    </RoleGate>
  );
}

