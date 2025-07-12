import { NextResponse } from 'next/server';
import appConfig from './config';
import { createClient } from '@supabase/supabase-js';
import { headers } from 'next/headers';

let clerkMiddleware: (arg0: (auth: any, req: any) => any) => { (arg0: any): any; new (): any },
  createRouteMatcher;

if (appConfig.auth.enabled) {
  try {
    ({ clerkMiddleware, createRouteMatcher } = require('@clerk/nextjs/server'));
  } catch (error) {
    console.warn('Clerk modules not available. Auth will be disabled.');
    appConfig.auth.enabled = false;
  }
}

const isProtectedRoute = appConfig.auth.enabled ? createRouteMatcher(['/dashboard(.*)', '/admin(.*)']) : () => false;
const isOnboardingRoute = appConfig.auth.enabled ? createRouteMatcher(['/onboarding']) : () => false;
const isApiRoute = (req: any) => req.nextUrl.pathname.startsWith('/api');

// Helper function to get user role
async function getUserRole(userId: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  const { data } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single();
  
  return data?.role;
}

// List of allowed origins for CORS - Add your frontend URL and other trusted domains
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  // Add more trusted domains if needed
];

export default async function middleware(req: any) {
  // Handle CORS for API routes
  if (isApiRoute(req)) {
    // Get headers asynchronously
    const headersList = await headers();
    const origin = headersList.get('origin');
    
    // Create base response
    const response = NextResponse.next();
    
    // Always allow the built-in frontend to access the API
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    
    // Only allow specified origins
    if (origin && allowedOrigins.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin);
    } else {
      // For non-allowed origins, set origin to null (blocks the request in browsers)
      response.headers.set('Access-Control-Allow-Origin', 'null');
    }
    
    // Handle preflight OPTIONS request
    if (req.method === 'OPTIONS') {
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
      response.headers.set('Access-Control-Max-Age', '86400'); // 24 hours
      
      return response;
    }
    
    // For clerk-based auth, proceed with auth check after setting CORS headers
    if (appConfig.auth.enabled) {
      return clerkMiddleware(async (auth, req) => {
        // Any additional auth checks for API routes
        return response;
      })(req);
    }
    
    return response;
  }

  // Handle non-API routes with clerk middleware if enabled
  if (appConfig.auth.enabled) {
    return clerkMiddleware(async (auth, req) => {
      const userId = await auth().userId;
      const path = req.nextUrl.pathname;
      
      // If user is not authenticated and tries to access protected routes
      if (!userId && (isProtectedRoute(req) || isOnboardingRoute(req))) {
        // Redirect to sign-in, CSP will be applied by next.config.js
        return await auth().redirectToSignIn({ returnBackUrl: req.url });
      }
      
      // User is authenticated
      if (userId) {
        // Check if user is trying to access the sign-in or sign-up pages
        if (path.startsWith('/sign-in') || path.startsWith('/sign-up')) {
          // Redirect to home page instead of dashboard
          return NextResponse.redirect(new URL('/', req.url));
        }
        
        // If user is going to home page and is authenticated, redirect to their dashboard
        if (path === '/') {
          try {
            const userRole = await getUserRole(userId);
            
            switch (userRole) {
              case 'site_admin':
                return NextResponse.redirect(new URL('/admin/dashboard', req.url));
              case 'company_admin':
                return NextResponse.redirect(new URL('/company/dashboard', req.url));
              case 'trainee':
                return NextResponse.redirect(new URL('/trainee/dashboard', req.url));
              default:
                // If no role, stay on home page
                return NextResponse.next();
        }
          } catch (error) {
            // If there's an error getting the role, stay on home page
            return NextResponse.next();
          }
        }

        // Admin routes will be protected by the RoleGate component instead
        // This avoids middleware issues with auth() function
      }
      
      // Allow unauthenticated users to access the home page
      return NextResponse.next();
    })(req);
  } else {
    // CSP will be applied by next.config.js
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
    '/admin/:path*'
  ],
};
