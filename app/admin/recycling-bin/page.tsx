import { createClient } from '@supabase/supabase-js';
import { RoleGate } from '@/components/RoleGate';
import { RecyclingBinManager } from '../../../components/RecyclingBinManager';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Clock, AlertTriangle } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function RecyclingBinPage() {
  // Get all soft-deleted companies
  const { data: deletedCompanies, error } = await supabase
    .from('companies')
    .select(`
      id,
      name,
      slug,
      description,
      max_trainees,
      is_active,
      created_at,
      deleted_at,
      deleted_by,
      deleted_reason
    `)
    .not('deleted_at', 'is', null)
    .order('deleted_at', { ascending: false });

  // Calculate stats
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
  
  const stats = {
    totalDeleted: deletedCompanies?.length || 0,
    recoverable: deletedCompanies?.filter(c => new Date(c.deleted_at) > thirtyDaysAgo).length || 0,
    permanentlyDeleted: deletedCompanies?.filter(c => new Date(c.deleted_at) <= thirtyDaysAgo).length || 0,
  };

  return (
    <RoleGate requiredRole="site_admin">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Recycling Bin</h1>
            <p className="text-gray-600 mt-1">Manage deleted companies and recovery options</p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Total Deleted</CardTitle>
              <Trash2 className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.totalDeleted}</div>
              <p className="text-xs text-gray-500 mt-1">Deleted companies</p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Recoverable</CardTitle>
              <Clock className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.recoverable}</div>
              <p className="text-xs text-gray-500 mt-1">Within 30 days</p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Permanently Deleted</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.permanentlyDeleted}</div>
              <p className="text-xs text-gray-500 mt-1">Over 30 days old</p>
            </CardContent>
          </Card>
        </div>

        {/* Recycling Bin Manager */}
        <RecyclingBinManager deletedCompanies={deletedCompanies || []} />
      </div>
    </RoleGate>
  );
} 