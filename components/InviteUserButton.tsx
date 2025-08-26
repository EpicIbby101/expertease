'use client';

import { useState } from 'react';
import { UserPlus } from 'lucide-react';
import { InviteUserModal } from './InviteUserModal';
import { useRouter } from 'next/navigation';

interface Company {
  id: string;
  name: string;
}

interface InviteUserButtonProps {
  companies: Company[];
}

export function InviteUserButton({ companies }: InviteUserButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  const handleInviteSuccess = () => {
    // Refresh the page to show the new invitation
    router.refresh();
  };

  const handleCompaniesUpdate = () => {
    // Refresh the page to get updated companies list
    router.refresh();
  };

  return (
    <>
      <button 
        onClick={() => setIsModalOpen(true)}
        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
      >
        <UserPlus className="h-4 w-4 mr-2" />
        Invite User
      </button>

      <InviteUserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        companies={companies}
        onInviteSuccess={handleInviteSuccess}
        onCompaniesUpdate={handleCompaniesUpdate}
      />
    </>
  );
} 