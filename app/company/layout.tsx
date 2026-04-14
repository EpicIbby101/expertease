import Link from 'next/link';
import { UserButton } from '@clerk/nextjs';
import { getUserRole } from '@/lib/auth';

export default async function CompanyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const role = await getUserRole();

  const getRoleDisplay = () => {
    switch (role) {
      case 'site_admin':
        return 'Site Administrator';
      case 'company_admin':
        return 'Company Administrator';
      case 'trainee':
        return 'Trainee';
      default:
        return 'User';
    }
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

      <nav className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap gap-1 px-4 py-2 sm:px-6 lg:px-8">
          {(
            [
              ['Dashboard', '/company/dashboard'],
              ['Trainees', '/company/trainees'],
              ['My details', '/company/profile'],
            ] as const
          ).map(([label, href]) => (
            <Link
              key={href}
              href={href}
              className="rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            >
              {label}
            </Link>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
} 