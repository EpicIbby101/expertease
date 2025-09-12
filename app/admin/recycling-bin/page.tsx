import { createClient } from '@supabase/supabase-js';
import { RoleGate } from '../../../components/RoleGate';
import { RecyclingBinManager } from '../../../components/RecyclingBinManager';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Clock, AlertTriangle, RefreshCw, Download, Settings, Users, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function RecyclingBinPage() {
  // Get all soft-deleted companies
  const { data: deletedCompanies, error: companiesError } = await supabase
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

  // Get all soft-deleted users (if the column exists)
  let deletedUsers: any[] = [];
  let usersError: any = null;
  
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select(`
        id,
        email,
        first_name,
        last_name,
        role,
        company_name,
        created_at,
        deleted_at,
        deleted_by,
        deleted_reason
      `)
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false });
    
    deletedUsers = users || [];
    usersError = error;
  } catch (error) {
    // If the column doesn't exist yet, just show empty array
    console.log('Users soft delete not yet implemented:', error);
    deletedUsers = [];
  }

  // Calculate stats
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
  
  const companyStats = {
    totalDeleted: deletedCompanies?.length || 0,
    recoverable: deletedCompanies?.filter(c => new Date(c.deleted_at) > thirtyDaysAgo).length || 0,
    permanentlyDeleted: deletedCompanies?.filter(c => new Date(c.deleted_at) <= thirtyDaysAgo).length || 0,
  };

  const userStats = {
    totalDeleted: deletedUsers?.length || 0,
    recoverable: deletedUsers?.filter(u => new Date(u.deleted_at) > thirtyDaysAgo).length || 0,
    permanentlyDeleted: deletedUsers?.filter(u => new Date(u.deleted_at) <= thirtyDaysAgo).length || 0,
  };

  return (
    <RoleGate requiredRole="site_admin">
      <div className="space-y-6">
        {/* Enhanced Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Recycling Bin</h1>
            <p className="text-gray-600 mt-1">Manage deleted companies and users with recovery options</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Trash2 className="h-4 w-4 text-red-600" />
                <span className="font-medium text-gray-900">{companyStats.totalDeleted + userStats.totalDeleted}</span>
                <span>total deleted</span>
              </div>
              <div className="h-4 w-px bg-gray-300"></div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-green-600" />
                <span className="font-medium text-green-600">{companyStats.recoverable + userStats.recoverable}</span>
                <span>recoverable</span>
              </div>
              <div className="h-4 w-px bg-gray-300"></div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <span className="font-medium text-orange-600">{companyStats.permanentlyDeleted + userStats.permanentlyDeleted}</span>
                <span>expired</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
        </div>

        {/* Show error if users soft delete isn't implemented yet */}
        {usersError && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-yellow-800">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-medium">Users Soft Delete Not Yet Implemented</span>
              </div>
              <p className="text-sm text-yellow-600 mt-1">
                The users table needs to be updated to support soft deletion. Only companies can be managed in the recycling bin for now.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Recycling Bin Manager */}
        <RecyclingBinManager 
          deletedCompanies={deletedCompanies || []} 
          deletedUsers={deletedUsers || []} 
        />
      </div>
    </RoleGate>
  );
}

