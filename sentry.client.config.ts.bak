import * as Sentry from '@sentry/nextjs';

/**
 * Sentry Client Configuration
 * Initializes error tracking for client-side code
 */

Sentry.init({
  // Sentry DSN
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
    // Replay integration
    new Sentry.Replay({
      maskAllText: true,
      blockAllMedia: true,
    }),

    // Browser tracing
    new Sentry.BrowserTracing(),

    // React Router integration (if using)
    // new Sentry.Integrations.BrowserTracing(),
  ],

  // Capture unhandled promise rejections
  attachStacktrace: true,

  // Maximum breadcrumbs
  maxBreadcrumbs: 50,

  // Breadcrumb filter
  beforeBreadcrumb(breadcrumb, hint) {
    // Filter out certain breadcrumbs
    if (breadcrumb.category === 'console' && breadcrumb.level === 'debug') {
      return null;
    }

    // Filter out navigation breadcrumbs in development
    if (
      process.env.NODE_ENV === 'development' &&
      breadcrumb.category === 'navigation'
    ) {
      return null;
    }

    return breadcrumb;
  },

  // Before sending to Sentry
  beforeSend(event, hint) {
    // Filter out certain errors
    if (event.exception) {
      const error = hint.originalException;

      // Ignore specific errors
      if (error instanceof Error) {
        // Ignore network errors in development
        if (
          process.env.NODE_ENV === 'development' &&
          error.message?.includes('Network')
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

  // Replay configuration
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  // Request bodies
  maxRequestBodySize: 'small',

  // Ignore errors
  ignoreErrors: [
    // Browser extensions
    'top.GLOBALS',
    // Random plugins/extensions
    'originalCreateNotification',
    'canvas.contentDocument',
    'MyApp_RemoveAllHighlights',
    // Network errors
    'NetworkError',
    'timeout',
  ],
});

export default Sentry;
