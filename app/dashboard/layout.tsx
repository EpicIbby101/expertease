import { UserButton } from '@clerk/nextjs';
import { getUserRole } from '@/lib/auth';

// We're avoiding any headers/cookies interaction completely to prevent the error

export default async function DashboardLayout({
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

  try {
    // The middleware will handle auth/redirects, so we don't need to do anything here
    // Since this is a protected route, if we got here, the user is authenticated
    
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

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </div>
    );
  } catch (error) {
    console.error("Error in dashboard layout:", error);
    
    return (
      <div className="min-h-screen w-full bg-background">
        <main className="mx-auto max-w-7xl w-full p-4 sm:p-6 lg:p-8">
          <h1>Something went wrong</h1>
        </main>
      </div>
    );
  }
}
