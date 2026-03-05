import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

/**
 * Rate Limiting Configuration
 * Uses Upstash Redis for distributed rate limiting
 */

// Initialize Upstash Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

/**
 * Auth Rate Limiter
 * 10 requests per 60 seconds per IP
 */
export const authRateLimiter = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(10, '60 s'),
  analytics: true,
  prefix: 'auth',
});

/**
 * API Rate Limiter
 * 100 requests per 60 seconds per user
 */
export const apiRateLimiter = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(100, '60 s'),
  analytics: true,
  prefix: 'api',
});

/**
 * Signup Rate Limiter
 * 5 signups per 3600 seconds (1 hour) per IP
 */
export const signupRateLimiter = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(5, '3600 s'),
  analytics: true,
  prefix: 'signup',
});

/**
 * Login Rate Limiter
 * 20 attempts per 900 seconds (15 minutes) per IP
 */
export const loginRateLimiter = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(20, '900 s'),
  analytics: true,
  prefix: 'login',
});

/**
 * Message Rate Limiter
 * 50 messages per 3600 seconds (1 hour) per user
 */
export const messageRateLimiter = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(50, '3600 s'),
  analytics: true,
  prefix: 'messages',
});

/**
 * Request Creation Rate Limiter
 * 20 requests per 3600 seconds (1 hour) per user
 */
export const requestCreationRateLimiter = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(20, '3600 s'),
  analytics: true,
  prefix: 'requests',
});

/**
 * Generic rate limit check function
 */
export async function checkRateLimit(
  limiter: Ratelimit,
  key: string
): Promise<{ success: boolean; remaining: number; reset: number }> {
  try {
    const result = await limiter.limit(key);
    return {
      success: result.success,
      remaining: result.remaining,
      reset: result.resetAfter,
    };
  } catch (error) {
    console.error('Rate limit check error:', error);
    // If Redis is down, allow the request (fail open)
    return {
      success: true,
      remaining: 100,
      reset: 0,
    };
  }
}

/**
 * Get client IP address from request
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
  return ip;
}

/**
 * Get user ID from auth header
 */
export function getUserIdFromAuth(authHeader: string | null): string | null {
  if (!authHeader) return null;

  try {
    const token = authHeader.replace('Bearer ', '');
    // Extract user ID from JWT (this is a placeholder)
    // In production, you'd decode the JWT properly
    return token.split('.')[1] || null;
  } catch {
    return null;
  }
}
