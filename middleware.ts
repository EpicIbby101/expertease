import { NextResponse } from 'next/server';
import appConfig from './config';
import { createServerActionClient } from '@/lib/supabase';
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
          // We'll use a redirect to dashboard first, then let dashboard layout handle onboarding check
          // CSP will be applied by next.config.js
          return NextResponse.redirect(new URL('/dashboard', req.url));
        }
        
        // For dashboard access, we need to check if user has completed onboarding
        if (path.startsWith('/dashboard')) {
          // We'll rely on a client-side check in the Dashboard component
          // The Dashboard component should check if the user has completed onboarding
          // and redirect to /onboarding if needed
          
          // Important: We need to make sure the Dashboard component implements this check
          // by calling the /api/user/check-onboarding endpoint
        }
        
        // If user is authenticated, they can access onboarding directly
        if (path.startsWith('/onboarding')) {
          return NextResponse.next(); // CSP will be applied by next.config.js
        }
        
        // If user is going to home page and is authenticated, redirect them to dashboard
        if (path === '/') {
          // Preserve existing headers when redirecting
          // CSP will be applied by next.config.js
          return NextResponse.redirect(new URL('/dashboard', req.url));
        }

        // Admin routes will be protected by the RoleGate component instead
        // This avoids middleware issues with auth() function
      }
      
      return NextResponse.next(); // CSP will be applied by next.config.js
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
