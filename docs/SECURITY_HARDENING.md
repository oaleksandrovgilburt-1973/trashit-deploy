# Security Hardening Documentation

## Overview

This document outlines the security measures implemented in TRASHit to protect against abuse, rate limiting attacks, and unauthorized access.

## Rate Limiting

### Overview
Rate limiting is implemented using Upstash Redis to prevent abuse and protect API endpoints from being overwhelmed.

### Configuration

#### Signup Rate Limiter
- **Limit:** 5 signups per 3600 seconds (1 hour) per IP
- **Endpoint:** `POST /api/v1/auth/signup`
- **Response:** 429 Too Many Requests

#### Login Rate Limiter
- **Limit:** 20 attempts per 900 seconds (15 minutes) per IP
- **Endpoint:** `POST /api/v1/auth/login`
- **Response:** 429 Too Many Requests

#### Auth Rate Limiter
- **Limit:** 10 requests per 60 seconds per IP
- **Endpoints:** All auth routes
- **Response:** 429 Too Many Requests

#### API Rate Limiter
- **Limit:** 100 requests per 60 seconds per user
- **Endpoints:** All API routes
- **Response:** 429 Too Many Requests

#### Message Rate Limiter
- **Limit:** 50 messages per 3600 seconds (1 hour) per user
- **Endpoint:** `POST /api/v1/messages`
- **Response:** 429 Too Many Requests

#### Request Creation Rate Limiter
- **Limit:** 20 requests per 3600 seconds (1 hour) per user
- **Endpoint:** `POST /api/v1/requests`
- **Response:** 429 Too Many Requests

### Implementation

**File:** `src/lib/rateLimit.ts`

```typescript
import { authRateLimiter, signupRateLimiter } from '@/lib/rateLimit';

// Check rate limit
const result = await authRateLimiter.limit(key);
if (!result.success) {
  return NextResponse.json(
    { error: 'Too many requests' },
    { status: 429, headers: { 'Retry-After': result.resetAfter } }
  );
}
```

### Upstash Configuration

**Environment Variables:**
```env
UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token
```

**Setup Steps:**
1. Create account at https://upstash.com
2. Create a Redis database
3. Copy REST URL and token
4. Add to `.env.local`

### Fail-Open Strategy

If Redis is unavailable, requests are allowed (fail-open). This ensures the service remains available even if rate limiting fails.

## User Blocking & Suspension

### User Blocking

Users can block other users to prevent communication.

**Database:** `user_blocks` table

**Fields:**
- `id` - UUID primary key
- `blocker_id` - User doing the blocking
- `blocked_user_id` - User being blocked
- `reason` - Optional reason for blocking
- `created_at` - Timestamp
- `updated_at` - Timestamp

**Constraints:**
- Unique: (blocker_id, blocked_user_id)
- No self-blocking allowed

**API Endpoints:**

```
POST /api/v1/users/[id]/block
Authorization: Bearer {token}

Body:
{
  "reason": "optional reason"
}

Response:
{
  "success": true,
  "message": "User successfully blocked"
}
```

```
DELETE /api/v1/users/[id]/block
Authorization: Bearer {token}

Response:
{
  "success": true,
  "message": "User successfully unblocked"
}
```

```
GET /api/v1/users/[id]/block
Authorization: Bearer {token}

Response:
{
  "blocked": true
}
```

### User Suspension

Admins can suspend or ban users through the admin panel.

**Suspension Types:**
1. **Suspended** (`is_blocked = true`)
   - User cannot access API
   - Can be unsuspended
   - Temporary action

2. **Banned** (`is_banned = true`)
   - User cannot use platform
   - Permanent action
   - Cannot be reversed

**Behavior:**
- Suspended users receive 403 Forbidden on all API calls
- Error message: `{ error: "account_suspended", message: "Your account is suspended or banned" }`
- All protected endpoints check suspension status

### Guard Functions

**File:** `src/lib/guards/isBlocked.ts`

```typescript
// Check if user is blocked
const blocked = await isUserBlocked(blockerId, blockedUserId);

// Check if user is suspended
const suspended = await isUserSuspended(userId);

// Get blocked users
const blockedUsers = await getBlockedUsers(userId);

// Get blockers
const blockers = await getBlockers(userId);

// Block user
const result = await blockUser(blockerId, blockedUserId, reason);

// Unblock user
const result = await unblockUser(blockerId, blockedUserId);

// Check if two users can communicate
const canComm = await canCommunicate(userId1, userId2);

// Validate user can perform action
const error = await validateUserCanAct(userId);
```

### Suspension Check Middleware

**File:** `src/lib/guards/checkSuspension.ts`

Use in protected endpoints:

```typescript
import { checkUserSuspension } from '@/lib/guards/checkSuspension';

export async function GET(request: NextRequest) {
  // Check if user is suspended
  const suspensionError = await checkUserSuspension(request);
  if (suspensionError) {
    return suspensionError;
  }

  // Continue with endpoint logic
  // ...
}
```

## Security Headers

### Content Security Policy (CSP)

Prevents XSS attacks by controlling which resources can be loaded.

**Policy:**
```
default-src 'self';
script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net;
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
font-src 'self' https://fonts.gstatic.com;
img-src 'self' data: https:;
connect-src 'self' https:;
frame-ancestors 'none';
```

### X-Frame-Options

Prevents clickjacking attacks.

**Value:** `DENY` - Page cannot be framed

### X-Content-Type-Options

Prevents MIME type sniffing.

**Value:** `nosniff` - Browser must respect declared content type

### X-XSS-Protection

Enables browser XSS filter.

**Value:** `1; mode=block` - Enable and block if XSS detected

### Referrer-Policy

Controls referrer information.

**Value:** `strict-origin-when-cross-origin` - Send referrer only for same-origin requests

### Permissions-Policy

Controls browser features.

**Value:** `geolocation=(), microphone=(), camera=()` - Disable all permissions

### Strict-Transport-Security

Forces HTTPS connections.

**Value:** `max-age=31536000; includeSubDomains` - 1 year max age

### Configuration

**File:** `next.config.ts`

Headers are configured in the `headers()` function and applied to all routes.

**Verification:**

```bash
# Check security headers
curl -I https://your-domain.com

# Should see:
# Content-Security-Policy: ...
# X-Frame-Options: DENY
# X-Content-Type-Options: nosniff
# X-XSS-Protection: 1; mode=block
# Referrer-Policy: strict-origin-when-cross-origin
# Permissions-Policy: ...
# Strict-Transport-Security: ...
```

## Middleware

**File:** `src/middleware.ts`

The middleware:
1. Adds security headers to all responses
2. Rate limits auth endpoints
3. Checks for suspended users on protected routes
4. Logs security events

**Configuration:**

```typescript
export const config = {
  matcher: [
    '/api/:path*',
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
```

## Audit Logging

### Block Audit Log

All user blocking actions are logged.

**Table:** `block_audit_log`

**Fields:**
- `id` - UUID primary key
- `blocker_id` - User performing action
- `blocked_user_id` - User affected
- `action` - 'block' or 'unblock'
- `reason` - Optional reason
- `created_at` - Timestamp

**Query:**

```sql
SELECT * FROM block_audit_log
WHERE blocker_id = 'user-id'
ORDER BY created_at DESC;
```

### Admin Logs

All admin actions are logged (see ADMIN_PANEL.md).

## Best Practices

### For Developers

1. **Always check suspension** on protected endpoints
2. **Use rate limiting** on sensitive operations
3. **Check blocking** before allowing communication
4. **Log security events** for audit trail
5. **Validate all input** to prevent injection
6. **Use HTTPS only** in production
7. **Keep secrets secure** in environment variables

### For Admins

1. **Monitor rate limit logs** for abuse patterns
2. **Review block audit logs** regularly
3. **Suspend users** who violate terms
4. **Ban repeat offenders** permanently
5. **Check security headers** are present
6. **Update security policies** as needed
7. **Review access logs** for suspicious activity

## Testing

### Rate Limiting

```bash
# Test signup rate limit (5 per hour)
for i in {1..11}; do
  curl -X POST http://localhost:3000/api/v1/auth/signup \
    -H "Content-Type: application/json" \
    -d '{"email":"test'$i'@example.com","password":"password"}'
  echo "Request $i"
done

# 11th request should return 429
```

### Suspension Check

```bash
# Suspend a user via admin panel
# Then try to use API as that user

curl http://localhost:3000/api/v1/requests \
  -H "Authorization: Bearer SUSPENDED_USER_TOKEN"

# Should return 403 with error: "account_suspended"
```

### Security Headers

```bash
# Check headers are present
curl -I http://localhost:3000

# Should include all security headers
```

### User Blocking

```bash
# Block a user
curl -X POST http://localhost:3000/api/v1/users/[id]/block \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason":"spam"}'

# Check if blocked
curl http://localhost:3000/api/v1/users/[id]/block \
  -H "Authorization: Bearer TOKEN"

# Unblock user
curl -X DELETE http://localhost:3000/api/v1/users/[id]/block \
  -H "Authorization: Bearer TOKEN"
```

## Troubleshooting

### Rate Limit Not Working

1. Verify Upstash credentials in `.env.local`
2. Check Redis connection is working
3. Verify rate limiter is called in endpoint
4. Check logs for rate limit errors

### Suspension Not Working

1. Verify `is_blocked` or `is_banned` is set in database
2. Check suspension check is called in endpoint
3. Verify user token is valid
4. Check logs for suspension check errors

### Security Headers Missing

1. Verify `next.config.ts` has headers configuration
2. Check middleware is enabled
3. Verify headers are in response (use curl -I)
4. Clear browser cache

### Blocking Not Working

1. Verify `user_blocks` table exists
2. Check RLS policies are enabled
3. Verify block/unblock functions are called
4. Check audit log for errors

## Security Checklist

- [ ] Rate limiting enabled on auth endpoints
- [ ] Rate limiting enabled on API endpoints
- [ ] User suspension check on protected endpoints
- [ ] User blocking prevents communication
- [ ] Security headers present on all responses
- [ ] HTTPS enforced in production
- [ ] Secrets not exposed in code
- [ ] Audit logs created for all actions
- [ ] Admin can suspend/ban users
- [ ] Blocked users cannot send messages
- [ ] Suspended users get 403 errors
- [ ] Rate limit 429 errors return Retry-After header

## Future Enhancements

1. **IP Whitelisting** - Allow certain IPs to bypass rate limits
2. **Captcha Integration** - Add CAPTCHA on signup/login
3. **Two-Factor Authentication** - Add 2FA for accounts
4. **Session Management** - Track and invalidate sessions
5. **Anomaly Detection** - Detect suspicious patterns
6. **Geo-blocking** - Block access from certain countries
7. **Device Fingerprinting** - Track device fingerprints
8. **Breach Detection** - Monitor for compromised credentials
