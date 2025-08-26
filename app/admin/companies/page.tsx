import { createClient } from '@supabase/supabase-js';
import { RoleGate } from '@/components/RoleGate';
import { CompanyManager } from '@/components/CompanyManager';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building, Users, Award, RefreshCw, Trash2 } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function AdminCompaniesPage() {
  // Get all companies with user counts
  // Filter out soft-deleted companies (deleted_at IS NULL)
  const { data: companies, error } = await supabase
    .from('companies')
    .select(`
      id,
      name,
      slug,
      description,
      max_trainees,
      is_active,
      created_at
    `)
    .is('deleted_at', null) // Only show non-deleted companies
    .order('created_at', { ascending: false });

  // Get user counts separately to avoid relationship conflicts
  let companiesWithUsers: Array<{
    id: string;
    name: string;
    slug: string;
    description?: string;
    max_trainees: number;
    is_active: boolean;
    created_at: string;
    users: Array<{ company_id: string; role: string }>;
  }> = [];
  
  if (companies && companies.length > 0) {
    const companyIds = companies.map(c => c.id);
    const { data: userCounts } = await supabase
      .from('users')
      .select('company_id, role')
      .in('company_id', companyIds);

    // Merge user data with companies
    companiesWithUsers = companies.map(company => ({
      ...company,
      users: userCounts?.filter(u => u.company_id === company.id) || []
    }));
  }

  // Debug logging
  console.log('Companies query result:', { companies: companiesWithUsers, error });
  console.log('Companies count:', companiesWithUsers?.length);
  console.log('First company:', companiesWithUsers?.[0]);

  // Calculate stats
  const stats = {
    totalCompanies: companiesWithUsers?.length || 0,
    activeCompanies: companiesWithUsers?.filter(c => c.is_active).length || 0,
    totalTrainees: companiesWithUsers?.reduce((sum, company) => 
      sum + (company.users?.filter(u => u.role === 'trainee').length || 0), 0) || 0,
  };

  return (
    <RoleGate requiredRole="site_admin">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Company Management</h1>
            <p className="text-gray-600 mt-1">Manage companies and their administrators</p>
          </div>
          <div className="flex gap-2">
            <a
              href="/admin/companies"
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </a>
            <a
              href="/admin/recycling-bin"
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-md shadow-sm hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Recycling Bin
            </a>
          </div>
        </div>

        {/* Debug Info */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 font-medium">Database Error:</p>
            <p className="text-red-600 text-sm">{error.message}</p>
            <p className="text-red-600 text-sm">Code: {error.code}</p>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Total Companies</CardTitle>
              <Building className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.totalCompanies}</div>
              <p className="text-xs text-gray-500 mt-1">Registered companies</p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Active Companies</CardTitle>
              <Award className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.activeCompanies}</div>
              <p className="text-xs text-gray-500 mt-1">Currently active</p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Total Trainees</CardTitle>
              <Users className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.totalTrainees}</div>
              <p className="text-xs text-gray-500 mt-1">Across all companies</p>
            </CardContent>
          </Card>
        </div>

        {/* Company Management */}
        <CompanyManager companies={companiesWithUsers || []} />
      </div>
    </RoleGate>
  );
} 