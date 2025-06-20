import { createClient } from '@supabase/supabase-js';
import { RoleGate } from '@/components/RoleGate';
import { getUserCompany } from '@/lib/auth';
import { TraineeManager } from '@/components/TraineeManager';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function CompanyTraineesPage() {
  const userCompany = await getUserCompany();
  console.log('userCompany data:', userCompany);
  
  // Get company trainees
  const { data: trainees } = await supabase
    .from('users')
    .select('id, email, role, created_at')
    .eq('company_id', userCompany?.company_id)
    .eq('role', 'trainee')
    .order('created_at', { ascending: false });

  console.log('trainees data:', trainees);
  console.log('companyId being passed:', userCompany?.company_id);

  return (
    <RoleGate requiredRole="company_admin">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Trainee Management</h1>
            <p className="text-gray-600 mt-1">
              Manage trainees for {userCompany?.company_name || 'your company'}
            </p>
          </div>
        </div>

        <TraineeManager 
          trainees={trainees || []} 
          companyId={userCompany?.company_id}
          companyName={userCompany?.company_name}
        />
      </div>
    </RoleGate>
  );
} 