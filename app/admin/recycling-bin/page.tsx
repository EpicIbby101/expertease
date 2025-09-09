import { createClient } from '@supabase/supabase-js';
import { RoleGate } from '../../../components/RoleGate';
import { RecyclingBinManager } from '../../../components/RecyclingBinManager';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Clock, AlertTriangle } from 'lucide-react';

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
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Recycling Bin</h1>
            <p className="text-gray-600 mt-1">Manage deleted companies and users with recovery options</p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Total Deleted</CardTitle>
              <Trash2 className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{companyStats.totalDeleted + userStats.totalDeleted}</div>
              <p className="text-xs text-gray-500 mt-1">Companies + Users</p>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Recoverable</CardTitle>
              <Clock className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{companyStats.recoverable + userStats.recoverable}</div>
              <p className="text-xs text-gray-500 mt-1">Within 30 days</p>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Permanently Deleted</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{companyStats.permanentlyDeleted + userStats.permanentlyDeleted}</div>
              <p className="text-xs text-gray-500 mt-1">Over 30 days old</p>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Companies</CardTitle>
              <Trash2 className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{companyStats.totalDeleted}</div>
              <p className="text-xs text-gray-500 mt-1">Deleted companies</p>
            </CardContent>
          </Card>
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
