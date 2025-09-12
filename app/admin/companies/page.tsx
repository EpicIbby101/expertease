import { createClient } from '@supabase/supabase-js';
import { RoleGate } from '@/components/RoleGate';
import { CompanyManager } from '@/components/CompanyManager';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building, Users, Award, RefreshCw, Trash2, Download, Settings, Plus } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

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
        {/* Enhanced Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Company Management</h1>
            <p className="text-gray-600 mt-1">Manage companies and their administrators</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-gray-900">{stats.totalCompanies}</span>
                <span>total</span>
              </div>
              <div className="h-4 w-px bg-gray-300"></div>
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-green-600" />
                <span className="font-medium text-green-600">{stats.activeCompanies}</span>
                <span>active</span>
              </div>
              <div className="h-4 w-px bg-gray-300"></div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-orange-600" />
                <span className="font-medium text-orange-600">{stats.totalTrainees}</span>
                <span>trainees</span>
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
              <Link href="/admin/recycling-bin">
                <Button variant="outline" size="sm" className="flex items-center gap-2 text-red-600 hover:text-red-700">
                  <Trash2 className="h-4 w-4" />
                  Recycling Bin
                </Button>
              </Link>
            </div>
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


        {/* Company Management */}
        <CompanyManager companies={companiesWithUsers || []} />

      </div>
    </RoleGate>
  );
} 