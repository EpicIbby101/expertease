import { RoleGate } from '../../../components/RoleGate';
import CompanyTicketManager from '@/components/CompanyTicketManager';

export default function AdminTicketsPage() {
  return (
    <RoleGate requiredRole="site_admin">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Support Tickets</h1>
          <p className="text-gray-600 mt-1">Manage all support tickets from across the platform</p>
        </div>
        <CompanyTicketManager />
      </div>
    </RoleGate>
  );
}

