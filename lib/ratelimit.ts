import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextRequest } from "next/server";

/**
 * Configuration for different rate limiting scenarios
 */
export const rateLimiters = {
  /**
   * General API rate limit - 20 requests per 10 seconds
   */
  api: new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(20, "10 s"),
    analytics: true,
  }),
  
  /**
   * Authentication endpoints - 5 requests per minute
   * Helps prevent brute force attacks
   */
  auth: new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(5, "60 s"),
    analytics: true,
  }),
  
  /**
   * Payment endpoints - 10 requests per minute
   */
  payment: new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(10, "60 s"),
    analytics: true,
  }),
};

/**
 * Get client identifier from request
 * Uses IP address, falling back to a fingerprint of user agent and other headers
 */
export function getClientIdentifier(req: NextRequest): string {
  // Get IP from Cloudflare headers if present
  const cfConnectingIp = req.headers.get("cf-connecting-ip");
  const forwardedFor = req.headers.get("x-forwarded-for");
  const ip = cfConnectingIp || forwardedFor || "anonymous";
  
  return ip;
}

/**
 * Apply rate limiting to a request and return whether it was successful
 * @param req The Next.js request object
 * @param limiterKey The rate limiter to use (api, auth, payment)
 * @returns Object with success flag and rate limit information
 */
export async function applyRateLimit(
  req: NextRequest, 
  limiterKey: keyof typeof rateLimiters = "api"
) {
  try {
    const identifier = getClientIdentifier(req);
    const limiter = rateLimiters[limiterKey];
    
    const result = await limiter.limit(identifier);
    
    // Add rate limit headers to the response
    const headers = new Headers();
    headers.set("X-RateLimit-Limit", result.limit.toString());
    headers.set("X-RateLimit-Remaining", result.remaining.toString());
    headers.set("X-RateLimit-Reset", result.reset.toString());
    
    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
      headers,
    };
  } catch (error) {
    console.error("Rate limiting error:", error);
    // If rate limiting fails, we allow the request through to avoid blocking legitimate traffic
    return { 
      success: true,
      limit: 0,
      remaining: 0,
      reset: 0,
      headers: new Headers()
    };
  }
} 