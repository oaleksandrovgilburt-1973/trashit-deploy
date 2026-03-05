# Security Testing Guide

## Prerequisites

1. Local development environment running
2. Upstash Redis configured
3. Admin user account created
4. Test users created (customer, provider)
5. curl or Postman for API testing

## Test Scenarios

### 1. Rate Limiting Tests

#### Test: Signup Rate Limit (5 per hour)
**Steps:**
1. Open terminal
2. Run signup request 6 times rapidly from same IP
3. Verify 6th request returns 429

**Command:**
```bash
for i in {1..6}; do
  echo "Request $i:"
  curl -X POST http://localhost:3000/api/v1/auth/signup \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"test$i@example.com\",\"password\":\"Test@1234\"}"
  echo ""
  sleep 1
done
```

**Expected Results:**
- ✓ Requests 1-5 return 201 Created
- ✓ Request 6 returns 429 Too Many Requests
- ✓ Response includes Retry-After header

#### Test: Login Rate Limit (20 per 15 minutes)
**Steps:**
1. Attempt login 21 times rapidly
2. Verify 21st request returns 429

**Command:**
```bash
for i in {1..21}; do
  echo "Request $i:"
  curl -X POST http://localhost:3000/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}'
  echo ""
  sleep 1
done
```

**Expected Results:**
- ✓ Requests 1-20 return 401 Unauthorized
- ✓ Request 21 returns 429 Too Many Requests
- ✓ Retry-After header present

#### Test: Auth Rate Limit (10 per 60 seconds)
**Steps:**
1. Make 11 auth requests within 60 seconds
2. Verify 11th returns 429

**Command:**
```bash
for i in {1..11}; do
  echo "Request $i:"
  curl -X GET http://localhost:3000/api/v1/auth/me \
    -H "Authorization: Bearer INVALID_TOKEN"
  echo ""
  sleep 3
done
```

**Expected Results:**
- ✓ Requests 1-10 return 401 Unauthorized
- ✓ Request 11 returns 429 Too Many Requests

#### Test: API Rate Limit (100 per 60 seconds)
**Steps:**
1. Make 101 API requests within 60 seconds
2. Verify 101st returns 429

**Command:**
```bash
TOKEN="your_valid_token"
for i in {1..101}; do
  echo "Request $i:"
  curl -X GET http://localhost:3000/api/v1/requests \
    -H "Authorization: Bearer $TOKEN"
  echo ""
  sleep 0.5
done
```

**Expected Results:**
- ✓ Requests 1-100 return 200 OK
- ✓ Request 101 returns 429 Too Many Requests

### 2. User Suspension Tests

#### Test: Suspended User Cannot Access API
**Steps:**
1. Log in as admin
2. Navigate to admin panel
3. Find a user and suspend them
4. Log in as suspended user
5. Try to access API endpoint

**Command:**
```bash
# Get suspended user token
SUSPENDED_TOKEN="token_of_suspended_user"

# Try to fetch requests
curl -X GET http://localhost:3000/api/v1/requests \
  -H "Authorization: Bearer $SUSPENDED_TOKEN"
```

**Expected Results:**
- ✓ Returns 403 Forbidden
- ✓ Error message: "account_suspended"
- ✓ Message: "Your account is suspended or banned"

#### Test: Suspended User Cannot Create Request
**Steps:**
1. Suspend a user
2. Try to create a request as suspended user
3. Verify 403 response

**Command:**
```bash
SUSPENDED_TOKEN="token_of_suspended_user"

curl -X POST http://localhost:3000/api/v1/requests \
  -H "Authorization: Bearer $SUSPENDED_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Test request",
    "category_id": "uuid",
    "region_id": "uuid",
    "address": "123 Main St"
  }'
```

**Expected Results:**
- ✓ Returns 403 Forbidden
- ✓ Error: "account_suspended"

#### Test: Unsuspended User Can Access API
**Steps:**
1. Unsuspend the user
2. Try to access API endpoint
3. Verify success

**Command:**
```bash
UNSUSPENDED_TOKEN="token_of_unsuspended_user"

curl -X GET http://localhost:3000/api/v1/requests \
  -H "Authorization: Bearer $UNSUSPENDED_TOKEN"
```

**Expected Results:**
- ✓ Returns 200 OK
- ✓ User can access API normally

### 3. User Blocking Tests

#### Test: Block User
**Steps:**
1. Get two user tokens
2. User A blocks User B
3. Verify block created

**Command:**
```bash
USER_A_TOKEN="token_of_user_a"
USER_B_ID="id_of_user_b"

curl -X POST http://localhost:3000/api/v1/users/$USER_B_ID/block \
  -H "Authorization: Bearer $USER_A_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason":"spam"}'
```

**Expected Results:**
- ✓ Returns 201 Created
- ✓ Success message: "User successfully blocked"

#### Test: Check Block Status
**Steps:**
1. Check if User A has blocked User B
2. Verify blocked status

**Command:**
```bash
USER_A_TOKEN="token_of_user_a"
USER_B_ID="id_of_user_b"

curl -X GET http://localhost:3000/api/v1/users/$USER_B_ID/block \
  -H "Authorization: Bearer $USER_A_TOKEN"
```

**Expected Results:**
- ✓ Returns 200 OK
- ✓ Response: `{"blocked": true}`

#### Test: Blocked User Cannot Send Message
**Steps:**
1. User A blocks User B
2. User B tries to send message to User A
3. Verify 403 response

**Command:**
```bash
USER_B_TOKEN="token_of_user_b"
USER_A_ID="id_of_user_a"

curl -X POST http://localhost:3000/api/v1/messages \
  -H "Authorization: Bearer $USER_B_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "recipient_id": "'$USER_A_ID'",
    "content": "Hello"
  }'
```

**Expected Results:**
- ✓ Returns 403 Forbidden
- ✓ Error: "User is blocked"

#### Test: Unblock User
**Steps:**
1. User A unblocks User B
2. Verify block removed

**Command:**
```bash
USER_A_TOKEN="token_of_user_a"
USER_B_ID="id_of_user_b"

curl -X DELETE http://localhost:3000/api/v1/users/$USER_B_ID/block \
  -H "Authorization: Bearer $USER_A_TOKEN"
```

**Expected Results:**
- ✓ Returns 200 OK
- ✓ Success message: "User successfully unblocked"

#### Test: Unblocked User Can Send Message
**Steps:**
1. User A unblocks User B
2. User B sends message to User A
3. Verify success

**Command:**
```bash
USER_B_TOKEN="token_of_user_b"
USER_A_ID="id_of_user_a"

curl -X POST http://localhost:3000/api/v1/messages \
  -H "Authorization: Bearer $USER_B_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "recipient_id": "'$USER_A_ID'",
    "content": "Hello"
  }'
```

**Expected Results:**
- ✓ Returns 201 Created
- ✓ Message successfully sent

### 4. Security Headers Tests

#### Test: Check Security Headers
**Steps:**
1. Make HEAD request to homepage
2. Verify all security headers present

**Command:**
```bash
curl -I http://localhost:3000
```

**Expected Results:**
- ✓ Content-Security-Policy header present
- ✓ X-Frame-Options: DENY
- ✓ X-Content-Type-Options: nosniff
- ✓ X-XSS-Protection: 1; mode=block
- ✓ Referrer-Policy: strict-origin-when-cross-origin
- ✓ Permissions-Policy: geolocation=(), microphone=(), camera=()
- ✓ Strict-Transport-Security: max-age=31536000

#### Test: Check API Security Headers
**Steps:**
1. Make request to API endpoint
2. Verify stricter CSP for API

**Command:**
```bash
curl -I http://localhost:3000/api/v1/requests
```

**Expected Results:**
- ✓ CSP: "default-src 'none'; frame-ancestors 'none';"
- ✓ X-Frame-Options: DENY
- ✓ X-Content-Type-Options: nosniff

### 5. Database Verification

#### Verify Block Audit Log
```sql
SELECT * FROM block_audit_log
ORDER BY created_at DESC LIMIT 10;
```

**Expected Results:**
- ✓ Shows all block/unblock actions
- ✓ Includes blocker_id, blocked_user_id, action
- ✓ Timestamps are accurate

#### Verify User Blocks
```sql
SELECT * FROM user_blocks
WHERE blocker_id = 'user-id'
ORDER BY created_at DESC;
```

**Expected Results:**
- ✓ Shows all active blocks
- ✓ No duplicate blocks (UNIQUE constraint)
- ✓ No self-blocks (CHECK constraint)

#### Verify Suspended Users
```sql
SELECT id, full_name, is_blocked, is_banned
FROM profiles
WHERE is_blocked = true OR is_banned = true;
```

**Expected Results:**
- ✓ Shows all suspended/banned users
- ✓ is_blocked or is_banned is true

### 6. Integration Tests

#### Test: Complete Blocking Flow
**Steps:**
1. User A blocks User B
2. User B tries to send message (should fail)
3. User A unblocks User B
4. User B sends message (should succeed)

**Commands:**
```bash
# Block
curl -X POST http://localhost:3000/api/v1/users/$USER_B_ID/block \
  -H "Authorization: Bearer $USER_A_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason":"spam"}'

# Try message (should fail)
curl -X POST http://localhost:3000/api/v1/messages \
  -H "Authorization: Bearer $USER_B_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"recipient_id":"'$USER_A_ID'","content":"Hello"}'

# Unblock
curl -X DELETE http://localhost:3000/api/v1/users/$USER_B_ID/block \
  -H "Authorization: Bearer $USER_A_TOKEN"

# Try message (should succeed)
curl -X POST http://localhost:3000/api/v1/messages \
  -H "Authorization: Bearer $USER_B_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"recipient_id":"'$USER_A_ID'","content":"Hello"}'
```

**Expected Results:**
- ✓ Block succeeds
- ✓ Message fails with 403
- ✓ Unblock succeeds
- ✓ Message succeeds

#### Test: Complete Suspension Flow
**Steps:**
1. User logs in and accesses API (success)
2. Admin suspends user
3. User tries to access API (fails)
4. Admin unsuspends user
5. User accesses API again (succeeds)

**Expected Results:**
- ✓ Initial API access succeeds
- ✓ After suspension: 403 Forbidden
- ✓ After unsuspension: API access succeeds

### 7. Performance Tests

#### Test: Rate Limit Performance
**Steps:**
1. Make 100 requests within 60 seconds
2. Measure response times
3. Verify no significant slowdown

**Command:**
```bash
time for i in {1..100}; do
  curl -s http://localhost:3000/api/v1/requests \
    -H "Authorization: Bearer $TOKEN" > /dev/null
done
```

**Expected Results:**
- ✓ Requests complete within reasonable time
- ✓ No significant slowdown from rate limiting
- ✓ Rate limit checks are fast (<10ms)

#### Test: Suspension Check Performance
**Steps:**
1. Make 100 requests as suspended user
2. Measure response times
3. Verify suspension check is fast

**Expected Results:**
- ✓ All requests return 403 quickly
- ✓ Suspension check is fast (<50ms)
- ✓ No database timeout

## Acceptance Criteria Checklist

- [ ] 11th signup within 60s from same IP returns 429
- [ ] 21st login within 15m from same IP returns 429
- [ ] Blocked user cannot send messages to blocker (403)
- [ ] Suspended user's API calls return 403
- [ ] Error message is "account_suspended"
- [ ] Security headers present on all responses
- [ ] X-Frame-Options: DENY
- [ ] X-Content-Type-Options: nosniff
- [ ] CSP header present
- [ ] Rate limit includes Retry-After header
- [ ] Block audit log records all actions
- [ ] User blocks table has no duplicates
- [ ] No self-blocking allowed
- [ ] Unblocked users can communicate
- [ ] Unsuspended users can access API
- [ ] All security headers verified with curl

## Troubleshooting

### Rate Limit Not Working
1. Verify Upstash credentials
2. Check Redis connection
3. Verify rate limiter is called
4. Check logs for errors

### Suspension Not Working
1. Verify is_blocked/is_banned in database
2. Check suspension check in endpoint
3. Verify user token is valid
4. Check logs

### Blocking Not Working
1. Verify user_blocks table exists
2. Check RLS policies enabled
3. Verify block functions called
4. Check audit log

### Headers Missing
1. Verify next.config.ts headers
2. Check middleware enabled
3. Clear browser cache
4. Verify with curl -I

## Performance Benchmarks

| Operation | Target | Actual |
|-----------|--------|--------|
| Rate limit check | <10ms | - |
| Suspension check | <50ms | - |
| Block check | <50ms | - |
| Security headers | <1ms | - |

## Security Checklist

- [ ] Rate limiting enabled
- [ ] User suspension working
- [ ] User blocking working
- [ ] Security headers present
- [ ] Audit logs created
- [ ] No SQL injection possible
- [ ] No XSS possible
- [ ] No CSRF possible
- [ ] Secrets not exposed
- [ ] HTTPS enforced
