import { PostHog } from 'posthog-node';

/**
 * PostHog Analytics Helper
 * Provides functions to track events and user properties
 */

// Initialize PostHog client
const posthog = new PostHog(
  process.env.NEXT_PUBLIC_POSTHOG_API_KEY || '',
  {
    host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
  }
);

/**
 * Track event with PostHog
 */
export function trackEvent(
  userId: string,
  eventName: string,
  properties?: Record<string, any>
) {
  try {
    posthog.capture({
      distinctId: userId,
      event: eventName,
      properties: {
        ...properties,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error tracking event:', error);
  }
}

/**
 * Set user properties
 */
export function setUserProperties(
  userId: string,
  properties: Record<string, any>
) {
  try {
    posthog.identify({
      distinctId: userId,
      properties: {
        ...properties,
        updated_at: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error setting user properties:', error);
  }
}

/**
 * Track request created event
 */
export function trackRequestCreated(
  userId: string,
  requestId: string,
  data: {
    category_id: string;
    region_id: string;
    amount?: number;
  }
) {
  trackEvent(userId, 'request_created', {
    request_id: requestId,
    category_id: data.category_id,
    region_id: data.region_id,
    amount: data.amount,
  });
}

/**
 * Track request accepted event
 */
export function trackRequestAccepted(
  userId: string,
  requestId: string,
  data: {
    customer_id: string;
    provider_id: string;
  }
) {
  trackEvent(userId, 'request_accepted', {
    request_id: requestId,
    customer_id: data.customer_id,
    provider_id: data.provider_id,
  });
}

/**
 * Track request started event
 */
export function trackRequestStarted(
  userId: string,
  requestId: string,
  data: {
    provider_id: string;
  }
) {
  trackEvent(userId, 'request_started', {
    request_id: requestId,
    provider_id: data.provider_id,
  });
}

/**
 * Track request completed event
 */
export function trackRequestCompleted(
  userId: string,
  requestId: string,
  data: {
    provider_id: string;
    amount: number;
  }
) {
  trackEvent(userId, 'request_completed', {
    request_id: requestId,
    provider_id: data.provider_id,
    amount: data.amount,
  });
}

/**
 * Track request closed event
 */
export function trackRequestClosed(
  userId: string,
  requestId: string,
  data: {
    status: string;
  }
) {
  trackEvent(userId, 'request_closed', {
    request_id: requestId,
    status: data.status,
  });
}

/**
 * Track dispute opened event
 */
export function trackDisputeOpened(
  userId: string,
  disputeId: string,
  data: {
    request_id: string;
    reason: string;
  }
) {
  trackEvent(userId, 'dispute_opened', {
    dispute_id: disputeId,
    request_id: data.request_id,
    reason: data.reason,
  });
}

/**
 * Track dispute resolved event
 */
export function trackDisputeResolved(
  userId: string,
  disputeId: string,
  data: {
    request_id: string;
    winner: string;
  }
) {
  trackEvent(userId, 'dispute_resolved', {
    dispute_id: disputeId,
    request_id: data.request_id,
    winner: data.winner,
  });
}

/**
 * Track message sent event
 */
export function trackMessageSent(
  userId: string,
  messageId: string,
  data: {
    recipient_id: string;
    request_id?: string;
  }
) {
  trackEvent(userId, 'message_sent', {
    message_id: messageId,
    recipient_id: data.recipient_id,
    request_id: data.request_id,
  });
}

/**
 * Track user signed up event
 */
export function trackUserSignup(
  userId: string,
  data: {
    email: string;
    role: string;
  }
) {
  trackEvent(userId, 'user_signup', {
    email: data.email,
    role: data.role,
  });

  setUserProperties(userId, {
    email: data.email,
    role: data.role,
    signup_date: new Date().toISOString(),
  });
}

/**
 * Track user logged in event
 */
export function trackUserLogin(userId: string) {
  trackEvent(userId, 'user_login', {
    timestamp: new Date().toISOString(),
  });
}

/**
 * Track provider approved event
 */
export function trackProviderApproved(
  userId: string,
  data: {
    provider_id: string;
  }
) {
  trackEvent(userId, 'provider_approved', {
    provider_id: data.provider_id,
  });

  setUserProperties(data.provider_id, {
    provider_status: 'approved',
    approved_date: new Date().toISOString(),
  });
}

/**
 * Track user suspended event
 */
export function trackUserSuspended(
  userId: string,
  data: {
    suspended_user_id: string;
    reason?: string;
  }
) {
  trackEvent(userId, 'user_suspended', {
    suspended_user_id: data.suspended_user_id,
    reason: data.reason,
  });

  setUserProperties(data.suspended_user_id, {
    is_blocked: true,
    suspended_date: new Date().toISOString(),
  });
}

/**
 * Track user unsuspended event
 */
export function trackUserUnsuspended(
  userId: string,
  data: {
    unsuspended_user_id: string;
  }
) {
  trackEvent(userId, 'user_unsuspended', {
    unsuspended_user_id: data.unsuspended_user_id,
  });

  setUserProperties(data.unsuspended_user_id, {
    is_blocked: false,
    unsuspended_date: new Date().toISOString(),
  });
}

/**
 * Track user banned event
 */
export function trackUserBanned(
  userId: string,
  data: {
    banned_user_id: string;
    reason?: string;
  }
) {
  trackEvent(userId, 'user_banned', {
    banned_user_id: data.banned_user_id,
    reason: data.reason,
  });

  setUserProperties(data.banned_user_id, {
    is_banned: true,
    banned_date: new Date().toISOString(),
  });
}

/**
 * Track payment processed event
 */
export function trackPaymentProcessed(
  userId: string,
  data: {
    request_id: string;
    amount: number;
    status: string;
  }
) {
  trackEvent(userId, 'payment_processed', {
    request_id: data.request_id,
    amount: data.amount,
    status: data.status,
  });
}

/**
 * Track payout processed event
 */
export function trackPayoutProcessed(
  userId: string,
  data: {
    provider_id: string;
    amount: number;
    status: string;
  }
) {
  trackEvent(userId, 'payout_processed', {
    provider_id: data.provider_id,
    amount: data.amount,
    status: data.status,
  });
}

/**
 * Track page view event
 */
export function trackPageView(
  userId: string,
  data: {
    page: string;
    path: string;
  }
) {
  trackEvent(userId, 'page_view', {
    page: data.page,
    path: data.path,
  });
}

/**
 * Track error event
 */
export function trackError(
  userId: string,
  data: {
    error_message: string;
    error_type: string;
    endpoint?: string;
  }
) {
  trackEvent(userId, 'error', {
    error_message: data.error_message,
    error_type: data.error_type,
    endpoint: data.endpoint,
  });
}

/**
 * Flush pending events
 */
export async function flushAnalytics() {
  try {
    await posthog.flush();
  } catch (error) {
    console.error('Error flushing analytics:', error);
  }
}

export default posthog;
