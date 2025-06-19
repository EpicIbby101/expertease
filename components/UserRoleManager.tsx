'use client';

import { useState } from 'react';
import { canManageUser } from '@/lib/auth';

interface User {
  id: string;
  email: string;
  role: 'site_admin' | 'company_admin' | 'trainee';
  company_name?: string;
}

interface UserRoleManagerProps {
  users: User[];
}

export function UserRoleManager({ users }: UserRoleManagerProps) {
  const [updating, setUpdating] = useState<string | null>(null);

  const updateRole = async (userId: string, newRole: 'site_admin' | 'company_admin' | 'trainee') => {
    setUpdating(userId);
    try {
      const response = await fetch('/api/admin/update-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole }),
      });

      if (!response.ok) throw new Error('Failed to update role');
      
      // Refresh the page to show updated roles
      window.location.reload();
    } catch (error) {
      console.error('Error updating role:', error);
      alert('Failed to update role');
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {users.map((user) => (
            <tr key={user.id}>
              <td className="px-6 py-4 whitespace-nowrap text-black">{user.email}</td>
              <td className="px-6 py-4 whitespace-nowrap text-black">{user.company_name || 'No Company'}</td>
              <td className="px-6 py-4 whitespace-nowrap text-black">{user.role}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                <select
                  value={user.role}
                  onChange={(e) => updateRole(user.id, e.target.value as 'site_admin' | 'company_admin' | 'trainee')}
                  disabled={updating === user.id}
                  className="rounded border p-1"
                >
                  <option value="trainee">Trainee</option>
                  <option value="company_admin">Company Admin</option>
                  <option value="site_admin">Site Admin</option>
                </select>
                {updating === user.id && <span className="ml-2">Updating...</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 