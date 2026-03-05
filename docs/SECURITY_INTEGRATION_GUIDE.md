# Security Integration Guide

## Overview

This guide explains how to integrate rate limiting, user suspension checks, and user blocking into existing API endpoints.

## Quick Start

### 1. Setup Upstash Redis

1. Go to https://upstash.com
2. Create a Redis database
3. Copy REST URL and token
4. Add to `.env.local`:
   ```env
   UPSTASH_REDIS_REST_URL=https://your-url.upstash.io
   UPSTASH_REDIS_REST_TOKEN=your_token
   ```

### 2. Apply Database Migration

Run the migration to create user blocking tables:

```bash
# In Supabase SQL Editor
-- Copy and run: supabase/migrations/015_user_blocks.sql
```

### 3. Install Dependencies

```bash
npm install @upstash/ratelimit @upstash/redis
```

## Integration Patterns

### Pattern 1: Add Rate Limiting to Endpoint

**File:** `src/app/api/v1/messages/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { messageRateLimiter, getClientIp } from '@/lib/rateLimit';

export async function POST(request: NextRequest) {
  // Get client IP or user ID
  const userId = 'user-id-from-token'; // Extract from auth token
  
  // Check rate limit
  try {
    const result = await messageRateLimiter.limit(userId);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Твърде много съобщения. Опитайте отново по-късно.' },
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

  // Continue with endpoint logic
  // ...
}
```

### Pattern 2: Add Suspension Check to Endpoint

**File:** `src/app/api/v1/requests/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { checkUserSuspension } from '@/lib/guards/checkSuspension';

export async function POST(request: NextRequest) {
  // Check if user is suspended
  const suspensionError = await checkUserSuspension(request);
  if (suspensionError) {
    return suspensionError;
  }

  // Continue with endpoint logic
  // ...
}
```

### Pattern 3: Add Blocking Check to Messaging

**File:** `src/app/api/v1/messages/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { canCommunicate } from '@/lib/guards/isBlocked';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { recipient_id } = body;
  
  // Get current user ID from token
  const userId = 'current-user-id';
  
  // Check if users can communicate
  const canComm = await canCommunicate(userId, recipient_id);
  if (!canComm) {
    return NextResponse.json(
      { error: 'Не можете да изпращате съобщения на този потребител' },
      { status: 403 }
    );
  }

  // Continue with endpoint logic
  // ...
}
```

### Pattern 4: Combined Security Checks

**File:** `src/app/api/v1/requests/[id]/accept/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { checkUserSuspension } from '@/lib/guards/checkSuspension';
import { apiRateLimiter } from '@/lib/rateLimit';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // 1. Check suspension
  const suspensionError = await checkUserSuspension(request);
  if (suspensionError) {
    return suspensionError;
  }

  // 2. Get user ID from token
  const userId = 'user-id-from-token';

  // 3. Check rate limit
  try {
    const result = await apiRateLimiter.limit(userId);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Твърде много заявки. Опитайте отново по-късно.' },
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
  }

  // 4. Continue with endpoint logic
  // ...
}
```

## Endpoint Integration Checklist

### Auth Endpoints

- [ ] `POST /api/v1/auth/signup` - Add signup rate limiter
- [ ] `POST /api/v1/auth/login` - Add login rate limiter
- [ ] `POST /api/v1/auth/logout` - Add suspension check
- [ ] `GET /api/v1/auth/me` - Add suspension check

### Request Endpoints

- [ ] `POST /api/v1/requests` - Add suspension check + rate limiter
- [ ] `GET /api/v1/requests` - Add suspension check
- [ ] `GET /api/v1/requests/[id]` - Add suspension check
- [ ] `PATCH /api/v1/requests/[id]` - Add suspension check
- [ ] `POST /api/v1/requests/[id]/accept` - Add suspension check + blocking check
- [ ] `POST /api/v1/requests/[id]/complete` - Add suspension check
- [ ] `POST /api/v1/requests/[id]/close` - Add suspension check
- [ ] `POST /api/v1/requests/[id]/dispute` - Add suspension check

### Message Endpoints

- [ ] `POST /api/v1/messages` - Add suspension check + rate limiter + blocking check
- [ ] `GET /api/v1/messages` - Add suspension check
- [ ] `GET /api/v1/messages/[id]` - Add suspension check
- [ ] `DELETE /api/v1/messages/[id]` - Add suspension check

### User Endpoints

- [ ] `GET /api/v1/users/[id]` - Add suspension check
- [ ] `PATCH /api/v1/users/[id]` - Add suspension check
- [ ] `POST /api/v1/users/[id]/block` - Add suspension check
- [ ] `DELETE /api/v1/users/[id]/block` - Add suspension check

### Admin Endpoints

- [ ] `GET /api/v1/admin/users` - Add admin check
- [ ] `GET /api/v1/admin/users/[id]` - Add admin check
- [ ] `PATCH /api/v1/admin/users/[id]` - Add admin check
- [ ] `GET /api/v1/admin/disputes` - Add admin check
- [ ] `PUT /api/v1/admin/disputes/[id]/resolve` - Add admin check

## Helper Functions Reference

### Rate Limiting

```typescript
import {
  authRateLimiter,
  apiRateLimiter,
  signupRateLimiter,
  loginRateLimiter,
  messageRateLimiter,
  requestCreationRateLimiter,
  checkRateLimit,
  getClientIp,
} from '@/lib/rateLimit';

// Check rate limit
const result = await checkRateLimit(limiter, key);
if (!result.success) {
  // Handle rate limit exceeded
}

// Get client IP
const ip = getClientIp(request);
```

### User Blocking

```typescript
import {
  isUserBlocked,
  isUserSuspended,
  getBlockedUsers,
  getBlockers,
  blockUser,
  unblockUser,
  canCommunicate,
  validateUserCanAct,
} from '@/lib/guards/isBlocked';

// Check if blocked
const blocked = await isUserBlocked(blockerId, blockedUserId);

// Check if suspended
const suspended = await isUserSuspended(userId);

// Check if can communicate
const canComm = await canCommunicate(userId1, userId2);

// Validate user can act
const error = await validateUserCanAct(userId);
if (error) {
  return NextResponse.json({ error }, { status: 403 });
}
```

### Suspension Check

```typescript
import { checkUserSuspension } from '@/lib/guards/checkSuspension';

// Check suspension
const suspensionError = await checkUserSuspension(request);
if (suspensionError) {
  return suspensionError;
}
```

## Error Responses

### Rate Limit Exceeded

```json
{
  "error": "Твърде много заявки. Опитайте отново по-късно.",
  "status": 429,
  "headers": {
    "Retry-After": "60"
  }
}
```

### User Suspended

```json
{
  "error": "account_suspended",
  "message": "Вашият акаунт е спрян или забранен",
  "status": 403
}
```

### User Blocked

```json
{
  "error": "Не можете да изпращате съобщения на този потребител",
  "status": 403
}
```

## Testing Integration

### Test Rate Limiting

```bash
# Rapid requests to trigger rate limit
for i in {1..11}; do
  curl -X POST http://localhost:3000/api/v1/auth/signup \
    -H "Content-Type: application/json" \
    -d '{"email":"test'$i'@example.com","password":"password"}'
  echo "Request $i"
done
```

### Test Suspension

```bash
# Get suspended user token
TOKEN="suspended_user_token"

# Try to access API
curl http://localhost:3000/api/v1/requests \
  -H "Authorization: Bearer $TOKEN"

# Should return 403 with error: "account_suspended"
```

### Test Blocking

```bash
# Block user
curl -X POST http://localhost:3000/api/v1/users/[id]/block \
  -H "Authorization: Bearer $TOKEN"

# Try to send message (should fail)
curl -X POST http://localhost:3000/api/v1/messages \
  -H "Authorization: Bearer $BLOCKED_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"recipient_id":"[blocker_id]","content":"Hello"}'

# Should return 403
```

## Monitoring & Logging

### Rate Limit Logs

Monitor rate limit events in your logging system:

```typescript
// Log rate limit exceeded
console.warn('Rate limit exceeded', {
  key: userId,
  limiter: 'messageRateLimiter',
  timestamp: new Date(),
});
```

### Suspension Logs

Monitor suspension checks:

```typescript
// Log suspension check
console.info('User suspended', {
  userId,
  action: 'api_access_denied',
  timestamp: new Date(),
});
```

### Block Logs

Block actions are automatically logged to `block_audit_log` table:

```sql
SELECT * FROM block_audit_log
WHERE created_at > NOW() - INTERVAL '1 day'
ORDER BY created_at DESC;
```

## Best Practices

1. **Always check suspension** on protected endpoints
2. **Always check blocking** before allowing communication
3. **Use appropriate rate limiters** for each operation
4. **Log security events** for audit trail
5. **Return appropriate error codes** (403, 429)
6. **Include Retry-After** header on rate limit responses
7. **Fail open** if rate limiter fails (allow request)
8. **Test security measures** thoroughly
9. **Monitor security logs** regularly
10. **Update security policies** as needed

## Troubleshooting

### Rate Limiter Not Working

**Problem:** Rate limit not being enforced

**Solution:**
1. Verify Upstash credentials in `.env.local`
2. Check Redis connection is working
3. Verify rate limiter is called in endpoint
4. Check logs for rate limit errors
5. Verify key is consistent (userId or IP)

### Suspension Check Not Working

**Problem:** Suspended users can still access API

**Solution:**
1. Verify `is_blocked` or `is_banned` is set in database
2. Check suspension check is called in endpoint
3. Verify user token is valid
4. Check logs for suspension check errors
5. Verify RLS policies allow admin to set is_blocked

### Blocking Not Working

**Problem:** Blocked users can still communicate

**Solution:**
1. Verify `user_blocks` table exists
2. Check RLS policies are enabled
3. Verify blocking check is called in endpoint
4. Check audit log for block/unblock actions
5. Verify blocking check logic is correct

## Performance Considerations

- Rate limit checks: <10ms
- Suspension checks: <50ms
- Blocking checks: <50ms
- Security headers: <1ms

Total overhead per request: <111ms

## Security Checklist

- [ ] Rate limiting enabled on auth endpoints
- [ ] Rate limiting enabled on sensitive endpoints
- [ ] Suspension check on all protected endpoints
- [ ] Blocking check on messaging endpoints
- [ ] Security headers present
- [ ] Audit logs created for all actions
- [ ] Error messages don't leak information
- [ ] Rate limit keys are consistent
- [ ] Fail-open strategy implemented
- [ ] Monitoring and alerting configured
