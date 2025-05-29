import { createBrowserClient, createServerClient } from '@supabase/ssr';

// Client-side Supabase client
export function createClient() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables'
    );
  }

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

// Server-side Supabase client
export async function createServerActionClient() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables'
    );
  }

  // Import cookies dynamically to prevent headers() errors at module initialization
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  
  // Create a custom cookie handler that doesn't use object spreading
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      cookies: {
        get(name) {
          const cookie = cookieStore.get(name);
          return cookie?.value;
        },
        set(name, value, options) {
          // Explicitly define all cookie properties to avoid object spreading
          cookieStore.set({
            name,
            value,
            path: options?.path,
            domain: options?.domain,
            maxAge: options?.maxAge,
            httpOnly: options?.httpOnly,
            secure: options?.secure,
            sameSite: options?.sameSite,
            expires: options?.expires,
            priority: options?.priority,
          });
        },
        remove(name, options) {
          // Explicitly define all cookie properties to avoid object spreading
          cookieStore.delete({
            name,
            path: options?.path,
            domain: options?.domain,
          });
        },
      },
    }
  );
}
