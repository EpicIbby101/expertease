import { createClient } from '@supabase/supabase-js';
import { RoleGate } from '@/components/RoleGate';
import { CompanyManager } from '@/components/CompanyManager';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building, Users, Award } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function AdminCompaniesPage() {
  // Get all companies with user counts
  const { data: companies } = await supabase
    .from('companies')
    .select(`
      id,
      name,
      slug,
      description,
      max_trainees,
      is_active,
      created_at,
      users!inner(id, role)
    `)
    .order('created_at', { ascending: false });

  // Calculate stats
  const stats = {
    totalCompanies: companies?.length || 0,
    activeCompanies: companies?.filter(c => c.is_active).length || 0,
    totalTrainees: companies?.reduce((sum, company) => 
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
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-900">Total Companies</CardTitle>
              <Building className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats.totalCompanies}</div>
              <p className="text-xs text-gray-500 mt-1">Registered companies</p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-900">Active Companies</CardTitle>
              <Award className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats.activeCompanies}</div>
              <p className="text-xs text-gray-500 mt-1">Currently active</p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-900">Total Trainees</CardTitle>
              <Users className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats.totalTrainees}</div>
              <p className="text-xs text-gray-500 mt-1">Across all companies</p>
            </CardContent>
          </Card>
        </div>

        {/* Company Management */}
        <CompanyManager companies={companies || []} />
      </div>
    </RoleGate>
  );
} 