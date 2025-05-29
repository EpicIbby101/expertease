import { createServerClient } from '@/lib/drizzle';

/**
 * Server component example using Supabase client 
 * This respects RLS policies configured in Supabase
 */
export default async function ServerComponentExample() {
  const supabase = await createServerClient();
  
  // Fetch users with Supabase client (respects RLS policies)
  const { data: users, error } = await supabase
    .from('user')
    .select('*')
    .limit(10);
  
  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-500 rounded-md">
        <h2 className="font-bold">Error fetching users</h2>
        <p>{error.message}</p>
      </div>
    );
  }
  
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Server Component Example</h1>
      <p className="mb-4 text-gray-600">
        This data was fetched server-side with Supabase client.
        RLS policies are respected.
      </p>
      
      <div className="border rounded-lg p-4">
        <h2 className="text-xl font-semibold mb-2">Users ({users.length})</h2>
        <ul className="space-y-2">
          {users.map((user) => (
            <li key={user.id} className="p-2 bg-gray-50 rounded">
              <p><span className="font-medium">ID:</span> {user.id}</p>
              <p><span className="font-medium">Email:</span> {user.email}</p>
              <p><span className="font-medium">Name:</span> {user.first_name} {user.last_name}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
} 