'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUserById, updateUserProfile } from './react-query-actions';

/**
 * Demo component showing React Query with Drizzle
 * 
 * This demonstrates:
 * 1. Basic query with loading state
 * 2. Mutation with optimistic updates
 * 3. Query invalidation
 */
export default function UserProfileDemo({ userId }: { userId: string }) {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
  });

  // Query for user data
  const {
    data: user,
    isLoading,
    isError,
    error
  } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => getUserById(userId)
  });

  // Mutation for updating user
  const updateUserMutation = useMutation({
    mutationFn: (data: typeof formData) => 
      updateUserProfile(userId, data),
    
    // Optimistic update
    onMutate: async (newData) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['user', userId] });
      
      // Save the previous value
      const previousUser = queryClient.getQueryData(['user', userId]);
      
      // Optimistically update the cache
      queryClient.setQueryData(['user', userId], (old: any) => ({
        ...old,
        ...newData
      }));
      
      // Return the previous user to roll back if something goes wrong
      return { previousUser };
    },
    
    // If the mutation fails, roll back
    onError: (err, newData, context) => {
      queryClient.setQueryData(
        ['user', userId],
        context?.previousUser
      );
    },
    
    // Refetch after success or error
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['user', userId] });
    }
  });

  // Load form data when user data is available
  const startEditing = () => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
      });
    }
    setIsEditing(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserMutation.mutate(formData);
    setIsEditing(false);
  };

  if (isLoading) {
    return <div className="p-4 animate-pulse">Loading user profile...</div>;
  }

  if (isError) {
    return <div className="p-4 text-red-500">Error: {error.message}</div>;
  }

  if (!user) {
    return <div className="p-4">User not found</div>;
  }

  return (
    <div className="border rounded-lg p-6 max-w-md mx-auto bg-white shadow">
      {!isEditing ? (
        <>
          <div className="mb-6">
            <h2 className="text-2xl font-bold">{user.firstName} {user.lastName}</h2>
          </div>
          <div className="flex justify-end">
            <button
              onClick={startEditing}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Edit Profile
            </button>
          </div>
        </>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">First Name</label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Last Name</label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              className="w-full p-2 border rounded"
            />
          </div>
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 border rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              disabled={updateUserMutation.isPending}
            >
              {updateUserMutation.isPending ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
} 