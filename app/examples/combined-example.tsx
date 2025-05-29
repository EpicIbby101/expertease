import { Suspense } from 'react';
import { createServerClient } from '@/lib/drizzle';
import ClientComponentExample from './client-component-example';

export default async function CombinedExamplePage() {
  const supabase = await createServerClient();
  
  // Fetch subscription plans from the server
  const { data: plans, error } = await supabase
    .from('subscriptions_plans')
    .select('*');
  
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Drizzle + Supabase Examples</h1>
      
      <div className="grid grid-cols-1 gap-8">
        {/* Server-rendered section */}
        <section className="p-6 bg-white shadow-md rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Server-Side Data (Subscription Plans)</h2>
          {error ? (
            <div className="p-4 bg-red-50 text-red-500 rounded-md">
              <p>Error loading plans: {error.message}</p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                This data was fetched on the server using Supabase client via createServerClient().
              </p>
              <ul className="divide-y">
                {plans?.map((plan) => (
                  <li key={plan.id} className="py-3">
                    <div className="flex justify-between">
                      <span className="font-medium">{plan.name}</span>
                      <span className="text-green-600">{plan.amount} {plan.currency}/{plan.interval}</span>
                    </div>
                    <p className="text-sm text-gray-600">{plan.description}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
        
        {/* Client Component */}
        <section className="p-6 bg-white shadow-md rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Client-Side Data (Users)</h2>
          <Suspense fallback={<div>Loading client component...</div>}>
            <ClientComponentExample />
          </Suspense>
        </section>
        
        {/* Server Action Integration */}
        <section className="p-6 bg-white shadow-md rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Server Actions</h2>
          <p className="text-sm text-gray-500 mb-4">
            Server actions use the direct Drizzle client for low-level database access.
            See utils/examples/server-action-example.ts for implementation details.
          </p>
          <div className="bg-gray-50 p-4 rounded text-sm font-mono">
            <pre>{`
// Server Action Example (utils/examples/server-action-example.ts)
'use server';

import { createDirectClient } from '@/lib/drizzle';
import { users } from '@/db/schema/users';
import { eq } from 'drizzle-orm';

export async function getUserById(id: string) {
  const db = createDirectClient();
  const user = await db.select().from(users).where(eq(users.userId, id));
  return { data: user[0] };
}
            `}</pre>
          </div>
        </section>
      </div>
    </div>
  );
} 