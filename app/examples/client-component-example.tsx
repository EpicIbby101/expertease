'use client';

import { createClient } from '@/lib/drizzle';
import { useState, useEffect } from 'react';

/**
 * Client component example using Supabase client
 * This respects RLS policies and can be used for user-specific data
 */
export default function ClientComponentExample() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function fetchUsers() {
      try {
        // Get Supabase client for client-side use
        const supabase = createClient();
        
        // Query using Supabase client (respects RLS policies)
        const { data, error } = await supabase
          .from('user')
          .select('*')
          .limit(5);
        
        if (error) throw new Error(error.message);
        
        setUsers(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    }
    
    fetchUsers();
  }, []);
  
  if (loading) {
    return <div className="p-4">Loading users...</div>;
  }
  
  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-500 rounded-md">
        <h2 className="font-bold">Error fetching users</h2>
        <p>{error}</p>
      </div>
    );
  }
  
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Client Component Example</h1>
      <p className="mb-4 text-gray-600">
        This data was fetched client-side with Supabase client.
        RLS policies are respected.
      </p>
      
      <div className="border rounded-lg p-4">
        <h2 className="text-xl font-semibold mb-2">Users ({users.length})</h2>
        <ul className="space-y-2">
          {users.map((user) => (
            <li key={user.id} className="p-2 bg-gray-50 rounded">
              <p><span className="font-medium">Email:</span> {user.email}</p>
              <p><span className="font-medium">Name:</span> {user.first_name} {user.last_name}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
} 