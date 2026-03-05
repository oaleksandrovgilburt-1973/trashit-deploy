/**
 * Instrumentation file for Sentry initialization
 * This file is automatically loaded by Next.js
 */

import * as Sentry from '@sentry/nextjs';

/**
 * Register function - called on server startup
 */
export async function register() {
  // Initialize Sentry for server-side
  if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
      release: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      debug: process.env.NODE_ENV !== 'production',
      integrations: [
        new Sentry.Integrations.Http({ tracing: true }),
        new Sentry.Integrations.OnUncaughtException(),
        new Sentry.Integrations.OnUnhandledRejection(),
      ],
      beforeSend(event, hint) {
        // Filter out certain errors
        if (event.exception) {
          const error = hint.originalException;
          if (error instanceof Error) {
            if (error.message?.includes('404')) {
              return null;
            }
            if (
              process.env.NODE_ENV === 'development' &&
              error.message?.includes('timeout')
            ) {
              return null;
            }
          }
        }
        return event;
      },
      allowUrls: [/https?:\/\/(localhost|.*\.trashit\.bg)/],
      denyUrls: [/chrome-extension:\/\//],
      attachStacktrace: true,
      maxBreadcrumbs: 50,
    });
  }
}
