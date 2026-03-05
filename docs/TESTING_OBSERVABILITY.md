# Observability Testing Guide

## Prerequisites

1. Sentry project created and DSN configured
2. PostHog project created and API key configured
3. Admin user account created
4. Test users created (customer, provider)
5. Database migrations applied (016_audit_log.sql)

## Test Scenarios

### 1. Sentry Error Monitoring

#### Test: Deliberate Error Appears in Sentry
**Steps:**
1. Create test endpoint that throws error
2. Call endpoint
3. Check Sentry dashboard within 30 seconds

**Test Endpoint:**
```typescript
// src/app/api/v1/test/sentry-error/route.ts
export async function GET() {
  throw new Error('Test error for Sentry');
}
```

**Call Endpoint:**
```bash
curl http://localhost:3000/api/v1/test/sentry-error
```

**Expected Results:**
- ✓ Error appears in Sentry within 30 seconds
- ✓ Stack trace is captured
- ✓ Error message is visible
- ✓ Breadcrumbs show request context

#### Test: Error with Context
**Steps:**
1. Create endpoint that captures error with context
2. Call endpoint
3. Check Sentry for context data

**Test Endpoint:**
```typescript
import * as Sentry from '@sentry/nextjs';

export async function POST(request: NextRequest) {
  try {
    throw new Error('Test error with context');
  } catch (error) {
    Sentry.captureException(error, {
      contexts: {
        request: {
          url: request.url,
          method: request.method,
        },
      },
      tags: {
        endpoint: 'test-error',
      },
    });
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
```

**Expected Results:**
- ✓ Error captured with context
- ✓ Tags visible in Sentry
- ✓ Request details included

#### Test: Performance Monitoring
**Steps:**
1. Make requests to various endpoints
2. Check Sentry Performance tab
3. Verify transaction tracing

**Expected Results:**
- ✓ Transactions recorded
- ✓ Response times tracked
- ✓ Database queries shown
- ✓ Performance issues flagged

### 2. PostHog Analytics

#### Test: Request Created Event
**Steps:**
1. Create a new request
2. Check PostHog dashboard
3. Verify event appears

**Steps:**
1. Log in as customer
2. Create a request
3. Wait 10 seconds
4. Go to PostHog dashboard
5. Check Events tab

**Expected Results:**
- ✓ `request_created` event appears
- ✓ Event includes request_id
- ✓ Event includes category_id
- ✓ Event includes region_id
- ✓ Timestamp is accurate

#### Test: Request Accepted Event
**Steps:**
1. Accept a request as provider
2. Check PostHog dashboard
3. Verify event appears

**Steps:**
1. Log in as provider
2. Accept a pending request
3. Wait 10 seconds
4. Check PostHog Events

**Expected Results:**
- ✓ `request_accepted` event appears
- ✓ Event includes request_id
- ✓ Event includes customer_id
- ✓ Event includes provider_id

#### Test: Request Completed Event
**Steps:**
1. Complete a request
2. Check PostHog dashboard
3. Verify event appears

**Steps:**
1. Log in as provider
2. Mark request as completed
3. Wait 10 seconds
4. Check PostHog Events

**Expected Results:**
- ✓ `request_completed` event appears
- ✓ Event includes request_id
- ✓ Event includes amount
- ✓ Event includes provider_id

#### Test: User Signup Event
**Steps:**
1. Create new user account
2. Check PostHog dashboard
3. Verify signup event

**Steps:**
1. Go to signup page
2. Create new account
3. Wait 10 seconds
4. Check PostHog Events

**Expected Results:**
- ✓ `user_signup` event appears
- ✓ Event includes email
- ✓ Event includes role
- ✓ User properties set

#### Test: Dispute Opened Event
**Steps:**
1. Open a dispute
2. Check PostHog dashboard
3. Verify event appears

**Steps:**
1. Mark request as completed
2. Open dispute
3. Wait 10 seconds
4. Check PostHog Events

**Expected Results:**
- ✓ `dispute_opened` event appears
- ✓ Event includes dispute_id
- ✓ Event includes request_id
- ✓ Event includes reason

#### Test: Event Properties
**Steps:**
1. Create request with specific properties
2. Check PostHog event details
3. Verify all properties captured

**Expected Results:**
- ✓ All properties present
- ✓ Values are correct
- ✓ Timestamps accurate
- ✓ User ID correct

#### Test: User Properties
**Steps:**
1. Create user with role
2. Check PostHog user properties
3. Verify properties set

**Expected Results:**
- ✓ User properties visible
- ✓ Role is set
- ✓ Email is set
- ✓ Signup date recorded

### 3. Audit Logging

#### Test: Request Status Change Logged
**Steps:**
1. Create a request
2. Accept request
3. Check audit log
4. Verify status change recorded

**Steps:**
1. Create request
2. Accept as provider
3. Go to `/admin/audit-log`
4. Filter by entity_type=request

**Expected Results:**
- ✓ Status change appears in log
- ✓ Action is "status_changed"
- ✓ Old status is "pending"
- ✓ New status is "accepted"
- ✓ Timestamp is accurate

#### Test: Dispute Status Change Logged
**Steps:**
1. Open a dispute
2. Resolve dispute
3. Check audit log
4. Verify status change recorded

**Steps:**
1. Open dispute
2. Resolve as admin
3. Go to `/admin/audit-log`
4. Filter by entity_type=dispute

**Expected Results:**
- ✓ Status change appears
- ✓ Action is "status_changed"
- ✓ Old status is "open"
- ✓ New status is "resolved"
- ✓ Admin ID recorded

#### Test: User Status Change Logged
**Steps:**
1. Suspend a user
2. Check audit log
3. Verify status change recorded

**Steps:**
1. Go to admin users
2. Suspend a user
3. Go to `/admin/audit-log`
4. Filter by entity_type=user

**Expected Results:**
- ✓ Status change appears
- ✓ Action is "status_changed"
- ✓ is_blocked changed to true
- ✓ Admin ID recorded

#### Test: Audit Log Pagination
**Steps:**
1. Go to audit log page
2. Verify pagination controls
3. Navigate through pages

**Expected Results:**
- ✓ 50 items per page
- ✓ Previous/Next buttons work
- ✓ Page indicator accurate
- ✓ Total count correct

#### Test: Audit Log Search
**Steps:**
1. Go to audit log page
2. Enter search term
3. Verify results filtered

**Expected Results:**
- ✓ Search filters description
- ✓ Results update in real-time
- ✓ Pagination resets
- ✓ Clear filters button works

#### Test: Audit Log Filtering
**Steps:**
1. Go to audit log page
2. Filter by entity type
3. Filter by action
4. Verify results

**Expected Results:**
- ✓ Entity type filter works
- ✓ Action filter works
- ✓ Multiple filters work together
- ✓ Results accurate

#### Test: Audit Log Timestamps
**Steps:**
1. Create multiple events
2. Check audit log
3. Verify timestamps are correct

**Expected Results:**
- ✓ Timestamps in correct format
- ✓ Timestamps in chronological order
- ✓ Timestamps match event creation time
- ✓ Timezone is correct

### 4. Integration Tests

#### Test: Complete Request Lifecycle with Observability
**Steps:**
1. Create request (check PostHog + audit log)
2. Accept request (check PostHog + audit log)
3. Start request (check PostHog + audit log)
4. Complete request (check PostHog + audit log)
5. Close request (check PostHog + audit log)

**Expected Results:**
- ✓ 5 PostHog events recorded
- ✓ 5 audit log entries created
- ✓ All timestamps accurate
- ✓ All user IDs correct

#### Test: Dispute Lifecycle with Observability
**Steps:**
1. Open dispute (check PostHog + audit log)
2. Resolve dispute (check PostHog + audit log)

**Expected Results:**
- ✓ 2 PostHog events recorded
- ✓ 2 audit log entries created
- ✓ Admin ID recorded
- ✓ Winner recorded

#### Test: User Management with Observability
**Steps:**
1. Approve provider (check PostHog + audit log)
2. Suspend user (check PostHog + audit log)
3. Unsuspend user (check PostHog + audit log)
4. Ban user (check PostHog + audit log)

**Expected Results:**
- ✓ 4 PostHog events recorded
- ✓ 4 audit log entries created
- ✓ All admin actions logged
- ✓ All reasons recorded

### 5. Database Verification

#### Verify Audit Log Table
```sql
SELECT * FROM audit_log
ORDER BY created_at DESC LIMIT 20;
```

**Expected Results:**
- ✓ Records exist
- ✓ All fields populated
- ✓ Timestamps accurate
- ✓ Entity IDs valid

#### Verify Audit Log Triggers
```sql
SELECT * FROM audit_log
WHERE entity_type = 'request'
AND action = 'status_changed'
ORDER BY created_at DESC LIMIT 5;
```

**Expected Results:**
- ✓ Status changes logged
- ✓ Old and new values recorded
- ✓ Changes field populated

#### Verify Audit Log Functions
```sql
SELECT * FROM get_audit_log_summary('request', NULL, 50, 0);
```

**Expected Results:**
- ✓ Function works
- ✓ Results paginated
- ✓ Actor names included

### 6. Performance Tests

#### Test: Sentry Performance Impact
**Steps:**
1. Make 100 requests
2. Measure response time
3. Verify no significant slowdown

**Expected Results:**
- ✓ Response time <100ms overhead
- ✓ No timeouts
- ✓ No memory leaks

#### Test: PostHog Performance Impact
**Steps:**
1. Track 100 events
2. Measure event tracking time
3. Verify async operation

**Expected Results:**
- ✓ Event tracking <50ms
- ✓ Async (doesn't block request)
- ✓ No memory leaks

#### Test: Audit Log Performance
**Steps:**
1. Create 100 audit log entries
2. Query audit log
3. Verify query performance

**Expected Results:**
- ✓ Inserts <100ms
- ✓ Queries <500ms
- ✓ Pagination works smoothly

### 7. Error Scenarios

#### Test: Sentry with Network Error
**Steps:**
1. Simulate network error
2. Check Sentry captures it
3. Verify error details

**Expected Results:**
- ✓ Network error captured
- ✓ Stack trace included
- ✓ Context preserved

#### Test: PostHog with Invalid Event
**Steps:**
1. Track event with missing properties
2. Check PostHog handles gracefully
3. Verify no crashes

**Expected Results:**
- ✓ Event still tracked
- ✓ Missing properties handled
- ✓ No errors thrown

#### Test: Audit Log with Large Values
**Steps:**
1. Log large JSONB values
2. Verify storage works
3. Check query performance

**Expected Results:**
- ✓ Large values stored
- ✓ No truncation
- ✓ Queries still fast

## Acceptance Criteria Checklist

- [ ] Deliberate 500 error appears in Sentry within 30s
- [ ] Error includes stack trace
- [ ] Error includes context data
- [ ] PostHog receives request_created event
- [ ] PostHog receives request_accepted event
- [ ] PostHog receives request_completed event
- [ ] PostHog receives dispute_opened event
- [ ] PostHog receives dispute_resolved event
- [ ] Audit log shows request status changes
- [ ] Audit log shows dispute status changes
- [ ] Audit log shows user status changes
- [ ] Audit log page shows correct actor
- [ ] Audit log page shows correct timestamps
- [ ] Audit log paginated (50 per page)
- [ ] Audit log search works
- [ ] Audit log filtering works
- [ ] All events have correct properties
- [ ] All timestamps are accurate
- [ ] No performance degradation
- [ ] No memory leaks

## Troubleshooting

### Sentry Not Capturing

1. Verify DSN is correct
2. Check environment variable
3. Verify error is not filtered
4. Check Sentry dashboard

### PostHog Not Receiving Events

1. Verify API key is correct
2. Check host URL
3. Verify events are tracked
4. Check PostHog dashboard

### Audit Log Not Recording

1. Verify table exists
2. Check RLS policies
3. Verify triggers enabled
4. Check database logs

### Performance Issues

1. Check query performance
2. Verify indexes exist
3. Check for N+1 queries
4. Monitor database load

## Monitoring Checklist

- [ ] Sentry dashboard accessible
- [ ] PostHog dashboard accessible
- [ ] Audit log page accessible
- [ ] Error alerts configured
- [ ] Event tracking working
- [ ] Database performance good
- [ ] No data loss
- [ ] Compliance requirements met
