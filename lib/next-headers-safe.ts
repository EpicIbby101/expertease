/**
 * Safe headers utility to properly handle headers() in Next.js 15
 * This helps avoid the "Route used `...headers()` or similar iteration" error
 */

import { cookies, headers } from 'next/headers';

/**
 * Safely get headers without triggering the iteration error
 * Always await this function when using it
 */
export async function safeHeaders() {
  const headersList = await headers();
  // Create a new object with all headers to avoid iteration issues
  const headersObj: Record<string, string> = {};
  
  // Using getAll() method to avoid iteration issues
  const headerNames = headersList.has('x-header-names') 
    ? headersList.get('x-header-names')?.split(',') 
    : ['user-agent', 'host', 'accept', 'accept-language', 'content-type', 'authorization'];
  
  if (headerNames) {
    for (const name of headerNames) {
      const value = headersList.get(name);
      if (value) {
        headersObj[name] = value;
      }
    }
  }
  
  return headersObj;
}

/**
 * Safely get a specific header value
 * Always await this function when using it
 */
export async function safeHeader(name: string): Promise<string | null> {
  const headersList = await headers();
  return headersList.get(name);
}

/**
 * Safely get cookies without triggering the iteration error
 * Always await this function when using it
 */
export async function safeCookies() {
  const cookieStore = await cookies();
  // Create a new object with all cookies to avoid iteration issues
  const cookiesObj: Record<string, string> = {};
  
  // We use a manual approach to avoid any form of iteration
  cookieStore.getAll().forEach((cookie) => {
    cookiesObj[cookie.name] = cookie.value;
  });
  
  return cookiesObj;
}

/**
 * Safely get a specific cookie value
 * Always await this function when using it
 */
export async function safeCookie(name: string): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(name)?.value;
} 