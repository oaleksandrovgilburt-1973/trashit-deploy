import { NextResponse } from 'next/server';

/**
 * Health Check Endpoint
 * Returns application health status
 */

export async function GET() {
  const startTime = Date.now();
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    checks: {} as Record<string, any>,
  };

  try {
    // Check database connection
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        process.env.SUPABASE_SERVICE_ROLE_KEY || ''
      );

      const { error } = await supabase.from('users').select('count', { count: 'exact' });

      health.checks.database = {
        status: error ? 'unhealthy' : 'healthy',
        message: error?.message || 'Connected',
      };
    } catch (error) {
      health.checks.database = {
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }

    // Check Redis connection
    try {
      if (process.env.UPSTASH_REDIS_REST_URL) {
        const response = await fetch(process.env.UPSTASH_REDIS_REST_URL, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
          },
          body: JSON.stringify(['PING']),
        });

        health.checks.redis = {
          status: response.ok ? 'healthy' : 'unhealthy',
          message: response.ok ? 'Connected' : 'Connection failed',
        };
      } else {
        health.checks.redis = {
          status: 'disabled',
          message: 'Redis not configured',
        };
      }
    } catch (error) {
      health.checks.redis = {
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }

    // Check external services
    health.checks.services = {
      stripe: process.env.STRIPE_SECRET_KEY ? 'configured' : 'not configured',
      resend: process.env.RESEND_API_KEY ? 'configured' : 'not configured',
      posthog: process.env.NEXT_PUBLIC_POSTHOG_API_KEY ? 'configured' : 'not configured',
      sentry: process.env.NEXT_PUBLIC_SENTRY_DSN ? 'configured' : 'not configured',
    };

    // Determine overall health
    const dbHealth = health.checks.database?.status;
    if (dbHealth === 'unhealthy') {
      health.status = 'unhealthy';
    }

    // Calculate response time
    const responseTime = Date.now() - startTime;
    health.checks.responseTime = `${responseTime}ms`;

    return NextResponse.json(health, {
      status: health.status === 'healthy' ? 200 : 503,
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
