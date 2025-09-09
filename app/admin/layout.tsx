import { UserButton } from '@clerk/nextjs';
import { getUserRole } from '@/lib/auth';
import { getUserCompany } from '@/lib/auth';
import Link from 'next/link';
import { Users, Mail, Building, Home, Shield, Settings, BarChart3 } from 'lucide-react';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const role = await getUserRole();
  const userCompany = await getUserCompany();

  const getRoleDisplay = () => {
    let roleText = '';
    switch (role) {
      case 'site_admin':
        roleText = 'Site Administrator';
        break;
      case 'company_admin':
        roleText = 'Company Administrator';
        break;
      case 'trainee':
        roleText = 'Trainee';
        break;
      default:
        roleText = 'User';
    }

    // Add company name for non-site admins
    if (role !== 'site_admin' && userCompany?.company_name) {
      roleText += ` at ${userCompany.company_name}`;
    }

    return roleText;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-900">Expert Ease</h1>
              <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                {getRoleDisplay()}
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <UserButton 
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: "h-8 w-8"
                  }
                }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      {role === 'site_admin' && (
        <nav className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex space-x-8">
              <Link 
                href="/admin/dashboard" 
                className="flex items-center px-3 py-4 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-b-2 hover:border-blue-500 transition-colors"
              >
                <Home className="h-4 w-4 mr-2" />
                Dashboard
              </Link>
              <Link 
                href="/admin/users" 
                className="flex items-center px-3 py-4 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-b-2 hover:border-blue-500 transition-colors"
              >
                <Users className="h-4 w-4 mr-2" />
                Users
              </Link>
              <Link 
                href="/admin/invitations" 
                className="flex items-center px-3 py-4 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-b-2 hover:border-blue-500 transition-colors"
              >
                <Mail className="h-4 w-4 mr-2" />
                Invitations
              </Link>
              <Link 
                href="/admin/companies" 
                className="flex items-center px-3 py-4 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-b-2 hover:border-blue-500 transition-colors"
              >
                <Building className="h-4 w-4 mr-2" />
                Companies
              </Link>
              <Link 
                href="/admin/analytics" 
                className="flex items-center px-3 py-4 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-b-2 hover:border-blue-500 transition-colors"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Analytics
              </Link>
              <Link 
                href="/admin/system-config" 
                className="flex items-center px-3 py-4 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-b-2 hover:border-blue-500 transition-colors"
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Link>

            </div>
          </div>
        </nav>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
} 