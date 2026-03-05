import { NextRequest, NextResponse } from 'next/server';
import {
  authRateLimiter,
  signupRateLimiter,
  loginRateLimiter,
  getClientIp,
} from '@/lib/rateLimit';
import { isUserSuspended } from '@/lib/guards/isBlocked';

/**
 * Middleware for rate limiting and security
 */
export async function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Add security headers
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https:; frame-ancestors 'none';"
  );
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=()'
  );

  // Rate limiting for auth routes
  if (request.nextUrl.pathname === '/api/v1/auth/signup') {
    const ip = getClientIp(request);
    try {
      const result = await signupRateLimiter.limit(ip);
      if (!result.success) {
        return NextResponse.json(
          { error: 'Твърде много опити. Опитайте отново по-късно.' },
          {
            status: 429,
            headers: {
              'Retry-After': Math.ceil(result.resetAfter / 1000).toString(),
            },
          }
        );
      }
    } catch (error) {
      console.error('Rate limit error:', error);
      // Fail open - allow request if rate limiter fails
    }
  }

  if (request.nextUrl.pathname === '/api/v1/auth/login') {
    const ip = getClientIp(request);
    try {
      const result = await loginRateLimiter.limit(ip);
      if (!result.success) {
        return NextResponse.json(
          { error: 'Твърде много неудачни опити. Опитайте отново по-късно.' },
          {
            status: 429,
            headers: {
              'Retry-After': Math.ceil(result.resetAfter / 1000).toString(),
            },
          }
        );
      }
    } catch (error) {
      console.error('Rate limit error:', error);
      // Fail open
    }
  }

  // Check for suspended users on protected endpoints
  if (request.nextUrl.pathname.startsWith('/api/v1/')) {
    const authHeader = request.headers.get('authorization');
    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '');
        // Extract user ID from token (this is a placeholder)
        // In production, you'd decode the JWT properly
        const parts = token.split('.');
        if (parts.length === 3) {
          // This is a simplified check - in production use proper JWT decoding
          // For now, we'll let the endpoint handle the suspension check
        }
      } catch (error) {
        console.error('Error checking suspension:', error);
      }
    }
  }

  return response;
}

// Configure which routes the middleware applies to
export const config = {
  matcher: [
    // Apply to all API routes
    '/api/:path*',
    // Apply to all app routes
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
