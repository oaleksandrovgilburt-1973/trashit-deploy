# Observability Documentation

## Overview

TRASHit implements comprehensive observability with three pillars:
1. **Error Monitoring** - Sentry for exception tracking
2. **Analytics** - PostHog for event tracking and user behavior
3. **Audit Logging** - Database audit trail for compliance

## Sentry Error Monitoring

### Setup

1. Create account at https://sentry.io
2. Create a new project (Next.js)
3. Get your DSN (Data Source Name)
4. Add to `.env.local`:
   ```env
   NEXT_PUBLIC_SENTRY_DSN=https://your-dsn@sentry.io/project-id
   NEXT_PUBLIC_APP_VERSION=1.0.0
   ```

### Configuration Files

**Server Configuration:** `sentry.server.config.ts`
- Initializes Sentry for server-side code
- Captures unhandled exceptions
- Tracks unhandled promise rejections
- Filters out certain errors

**Client Configuration:** `sentry.client.config.ts`
- Initializes Sentry for client-side code
- Enables session replay
- Captures browser errors
- Tracks performance metrics

**Instrumentation:** `src/instrumentation.ts`
- Automatically loaded by Next.js
- Initializes Sentry on server startup

### Features

#### Error Capture
```typescript
import * as Sentry from '@sentry/nextjs';

try {
  // Code that might throw
} catch (error) {
  Sentry.captureException(error);
}
```

#### Manual Event Capture
```typescript
Sentry.captureMessage('Something went wrong', 'error');
```

#### Performance Monitoring
- Automatic transaction tracking
- Database query monitoring
- API endpoint tracing

#### Session Replay
- Records user sessions on errors
- Helps debug issues
- Privacy-respecting (masks sensitive data)

### Sentry Dashboard

Access at https://sentry.io to view:
- Error trends
- Error details with stack traces
- Session replays
- Performance metrics
- Release tracking

### Error Filtering

Certain errors are filtered out:
- 404 errors
- Network timeouts in development
- Browser extension errors
- Chrome extension errors

## PostHog Analytics

### Setup

1. Create account at https://posthog.com
2. Create a new project
3. Get your API key and host
4. Add to `.env.local`:
   ```env
   NEXT_PUBLIC_POSTHOG_API_KEY=your-api-key
   NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
   ```

### Analytics Helper

**File:** `src/lib/analytics.ts`

Provides helper functions for tracking events:

```typescript
import {
  trackRequestCreated,
  trackRequestAccepted,
  trackRequestCompleted,
  trackDisputeOpened,
  trackUserSignup,
  trackPaymentProcessed,
} from '@/lib/analytics';

// Track request created
trackRequestCreated(userId, requestId, {
  category_id: 'uuid',
  region_id: 'uuid',
  amount: 100,
});

// Track request accepted
trackRequestAccepted(userId, requestId, {
  customer_id: 'uuid',
  provider_id: 'uuid',
});

// Track user signup
trackUserSignup(userId, {
  email: 'user@example.com',
  role: 'provider',
});
```

### Events Tracked

#### Request Lifecycle
- `request_created` - User creates a request
- `request_accepted` - Provider accepts request
- `request_started` - Provider starts work
- `request_completed` - Provider marks complete
- `request_closed` - Payment captured/refunded

#### Disputes
- `dispute_opened` - Customer opens dispute
- `dispute_resolved` - Admin resolves dispute

#### User Management
- `user_signup` - New user registers
- `user_login` - User logs in
- `provider_approved` - Admin approves provider
- `user_suspended` - Admin suspends user
- `user_unsuspended` - Admin unsuspends user
- `user_banned` - Admin bans user

#### Payments
- `payment_processed` - Payment captured
- `payout_processed` - Payout sent to provider

#### Communication
- `message_sent` - User sends message

#### Other
- `page_view` - User views page
- `error` - Error occurred

### PostHog Dashboard

Access at https://posthog.com to view:
- Event trends
- User funnels
- Cohort analysis
- User properties
- Feature flags

### Event Properties

Each event includes:
- `distinctId` - User ID
- `event` - Event name
- `timestamp` - ISO timestamp
- `properties` - Event-specific data

Example event:
```json
{
  "distinctId": "user-id",
  "event": "request_created",
  "timestamp": "2026-03-05T10:30:00Z",
  "properties": {
    "request_id": "req-id",
    "category_id": "cat-id",
    "region_id": "reg-id",
    "amount": 100
  }
}
```

## Audit Logging

### Database Schema

**Table:** `audit_log`

Fields:
- `id` - UUID primary key
- `actor_id` - User performing action
- `actor_email` - User email
- `entity_type` - Type of entity (request, dispute, user, etc.)
- `entity_id` - ID of entity
- `action` - Action performed (created, updated, deleted, etc.)
- `old_values` - Previous values (for updates)
- `new_values` - New values (for updates)
- `changes` - Specific fields that changed
- `description` - Human-readable description
- `ip_address` - IP address of request
- `user_agent` - Browser user agent
- `status_code` - HTTP status code
- `error_message` - Error message if failed
- `created_at` - Timestamp
- `updated_at` - Last updated

### Automatic Logging

Triggers automatically log:
- Request status changes
- Dispute status changes
- User status changes (suspended, banned)

### Manual Logging

Create audit log entries manually:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(url, key);

await supabase.from('audit_log').insert({
  actor_id: userId,
  actor_email: userEmail,
  entity_type: 'request',
  entity_id: requestId,
  action: 'created',
  description: 'Request created by user',
  new_values: { status: 'pending' },
});
```

### Audit Log API

**Endpoint:** `GET /api/v1/admin/audit-log`

Query parameters:
- `entity_type` - Filter by entity type
- `entity_id` - Filter by entity ID
- `action` - Filter by action
- `actor_id` - Filter by actor
- `search` - Search in description
- `limit` - Results per page (default 50)
- `offset` - Pagination offset

Example:
```bash
curl http://localhost:3000/api/v1/admin/audit-log \
  -H "Authorization: Bearer TOKEN" \
  -G \
  -d "entity_type=request" \
  -d "action=status_changed" \
  -d "limit=50" \
  -d "offset=0"
```

### Audit Log Admin UI

**Location:** `/admin/audit-log`

Features:
- Searchable audit log
- Filter by entity type
- Filter by action
- Pagination (50 per page)
- Timestamps and actor info
- Human-readable descriptions

## Integration Guide

### Integrate Sentry into Endpoints

```typescript
import * as Sentry from '@sentry/nextjs';

export async function POST(request: NextRequest) {
  try {
    // Endpoint logic
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### Integrate PostHog into Endpoints

```typescript
import { trackRequestCreated } from '@/lib/analytics';

export async function POST(request: NextRequest) {
  // Create request
  const requestId = 'new-id';
  
  // Track event
  trackRequestCreated(userId, requestId, {
    category_id,
    region_id,
    amount,
  });
  
  return NextResponse.json({ success: true });
}
```

### Integrate Audit Logging into Endpoints

```typescript
export async function POST(request: NextRequest) {
  // Create request
  
  // Log to audit trail
  await supabase.from('audit_log').insert({
    actor_id: userId,
    entity_type: 'request',
    entity_id: requestId,
    action: 'created',
    description: 'Request created',
    new_values: { status: 'pending' },
  });
  
  return NextResponse.json({ success: true });
}
```

## Monitoring & Alerting

### Sentry Alerts

Set up alerts in Sentry for:
- New issues
- Error rate threshold
- Performance degradation
- Release tracking

### PostHog Insights

Create insights for:
- Daily active users
- Request completion rate
- Dispute resolution time
- Payment success rate

### Audit Log Monitoring

Monitor audit logs for:
- Suspicious admin actions
- Bulk user suspensions
- Unusual payment patterns
- Security events

## Best Practices

1. **Error Handling**
   - Catch and log all errors
   - Include context in error messages
   - Use Sentry for unexpected errors

2. **Event Tracking**
   - Track all key user actions
   - Include relevant properties
   - Use consistent event names
   - Flush events before shutdown

3. **Audit Logging**
   - Log all admin actions
   - Log all status changes
   - Include before/after values
   - Include user context

4. **Privacy**
   - Mask sensitive data
   - Don't log passwords
   - Don't log payment details
   - Comply with GDPR

5. **Performance**
   - Use sampling for high-volume events
   - Batch audit log writes
   - Use async logging
   - Monitor log storage

## Troubleshooting

### Sentry Not Capturing Errors

1. Verify DSN is correct
2. Check environment variable is set
3. Verify error is not filtered
4. Check Sentry dashboard for issues

### PostHog Not Receiving Events

1. Verify API key is correct
2. Check host URL is correct
3. Verify events are being tracked
4. Check PostHog dashboard

### Audit Log Not Recording

1. Verify audit_log table exists
2. Check RLS policies allow inserts
3. Verify triggers are enabled
4. Check database logs for errors

## Performance Considerations

- Sentry: <10ms per error capture
- PostHog: <50ms per event (async)
- Audit logging: <100ms per write (async)

Total overhead: <160ms per request

## Compliance

### GDPR

- User data is encrypted in transit
- Session replay masks sensitive data
- Audit logs retained for compliance
- User can request data deletion

### SOC 2

- All actions logged and auditable
- Error tracking for reliability
- Performance monitoring
- Access controls enforced

## Future Enhancements

1. **Custom Dashboards**
   - Real-time metrics
   - Custom alerts
   - Automated reports

2. **Advanced Analytics**
   - Funnel analysis
   - Cohort analysis
   - Retention tracking

3. **Log Retention**
   - Archive old logs
   - Compliance retention policies
   - Search historical data

4. **Alerting**
   - Slack notifications
   - Email alerts
   - PagerDuty integration

5. **Tracing**
   - Distributed tracing
   - Request correlation
   - Performance profiling
