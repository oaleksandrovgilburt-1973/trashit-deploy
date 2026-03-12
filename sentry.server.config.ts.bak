import * as Sentry from '@sentry/nextjs';

/**
 * Sentry Server Configuration
 * Initializes error tracking for server-side code
 */

Sentry.init({
  // Sentry DSN (Data Source Name)
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Environment
  environment: process.env.NODE_ENV || 'development',

  // Release version
  release: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',

  // Tracing
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Debug mode
  debug: process.env.NODE_ENV !== 'production',

  // Integrations
  integrations: [
    // HTTP client integration
    new Sentry.Integrations.Http({ tracing: true }),

    // Node integration
    new Sentry.Integrations.OnUncaughtException(),
    new Sentry.Integrations.OnUnhandledRejection(),

    // Database integration (if using)
    // new Sentry.Integrations.Postgres(),
  ],

  // Before sending to Sentry
  beforeSend(event, hint) {
    // Filter out certain errors
    if (event.exception) {
      const error = hint.originalException;

      // Ignore specific errors
      if (error instanceof Error) {
        // Ignore 404 errors
        if (error.message?.includes('404')) {
          return null;
        }

        // Ignore network timeouts in development
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

  // Allowed URLs
  allowUrls: [/https?:\/\/(localhost|.*\.trashit\.bg)/],

  // Denied URLs
  denyUrls: [/chrome-extension:\/\//],

  // Attach stack traces
  attachStacktrace: true,

  // Maximum breadcrumbs
  maxBreadcrumbs: 50,

  // Breadcrumb filter
  beforeBreadcrumb(breadcrumb, hint) {
    // Filter out certain breadcrumbs
    if (breadcrumb.category === 'console' && breadcrumb.level === 'debug') {
      return null;
    }

    return breadcrumb;
  },

  // Server name
  serverName: process.env.VERCEL_URL || 'localhost',

  // Request bodies
  maxRequestBodySize: 'small',

  // Include local variables
  includeLocalVariables: true,

  // Capture unhandled promise rejections
  onUncaughtException: (error) => {
    console.error('Uncaught exception:', error);
  },

  onUnhandledRejection: (reason) => {
    console.error('Unhandled rejection:', reason);
  },
});

export default Sentry;
