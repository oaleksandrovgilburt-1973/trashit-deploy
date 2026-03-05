# Testing Guide: Disputes & Reports System

## Prerequisites

1. Database migration applied: `014_disputes_and_reports.sql`
2. Test users created with different roles (customer, provider, admin)
3. Test requests in 'completed' status
4. Resend API key configured (optional for email testing)

## Test Scenarios

### 1. Create Dispute - Happy Path

**Steps:**
1. Create a completed request with customer A and provider B
2. Wait 1 minute (to ensure it's past creation time)
3. Log in as customer A
4. Navigate to request detail page
5. Click "Отворете спор" button
6. Select reason: "incomplete_work"
7. Enter description: "Work was not completed properly"
8. Submit form

**Expected Results:**
- ✓ Dispute created successfully
- ✓ Request status changes to 'disputed'
- ✓ Dispute appears in admin dashboard
- ✓ Email sent to provider (if Resend configured)
- ✓ Email sent to admins (if Resend configured)
- ✓ In-app notification created for provider
- ✓ In-app notification created for admins
- ✓ Success message displayed

**Test Command:**
```bash
curl -X POST http://localhost:3000/api/v1/test/disputes \
  -H "Content-Type: application/json" \
  -d '{
    "requestId": "REQUEST_UUID",
    "customerId": "CUSTOMER_UUID",
    "providerId": "PROVIDER_UUID",
    "reason": "incomplete_work"
  }'
```

### 2. Create Dispute - Outside 48-Hour Window

**Steps:**
1. Create a request that was completed more than 48 hours ago
2. Log in as customer
3. Try to open dispute

**Expected Results:**
- ✗ Error message: "Спорът може да бъде отворен само в рамките на 48 часа след завършване"
- ✗ Dispute not created
- ✗ Request status remains 'completed'

### 3. Create Dispute - Non-Customer

**Steps:**
1. Create a completed request
2. Log in as provider (not the customer)
3. Try to navigate to dispute page

**Expected Results:**
- ✗ Access denied
- ✗ Redirected or error message shown

### 4. Create Duplicate Dispute

**Steps:**
1. Create a dispute for request A
2. Try to create another dispute for same request

**Expected Results:**
- ✗ Error message: "За тази заявка вече е отворен спор"
- ✗ Second dispute not created

### 5. Admin Resolves Dispute

**Steps:**
1. Create a dispute (from test scenario 1)
2. Log in as admin
3. Navigate to `/dashboard/admin/disputes`
4. Click on the dispute
5. Enter resolution text
6. (Optional) Enter refund amount
7. Click "Разрешете спор"

**Expected Results:**
- ✓ Dispute status changes to 'resolved'
- ✓ Request status changes to 'closed'
- ✓ Resolution text saved
- ✓ Resolved timestamp recorded
- ✓ Success message displayed
- ✓ Notifications sent to both parties

### 6. Create User Report

**Steps:**
1. Log in as user A
2. Navigate to user B's profile
3. Click "Report user" button
4. Select reason: "fraud"
5. Enter description
6. Submit

**Expected Results:**
- ✓ Report created successfully
- ✓ Report appears in admin dashboard
- ✓ Email sent to admins
- ✓ Success message displayed

**Test Command:**
```bash
curl -X POST http://localhost:3000/api/v1/users/USER_B_UUID/report \
  -H "Authorization: Bearer USER_A_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "fraud",
    "description": "User is scamming customers"
  }'
```

### 7. Prevent Self-Report

**Steps:**
1. Log in as user A
2. Try to report user A

**Expected Results:**
- ✗ Error message: "Не можете да докладвате сами на себе си"
- ✗ Report not created

### 8. Prevent Duplicate Reports

**Steps:**
1. Create report from user A to user B
2. Try to create another report from user A to user B

**Expected Results:**
- ✗ Error message: "Вече сте докладвали този потребител"
- ✗ Second report not created

### 9. Admin Resolves Report

**Steps:**
1. Create a user report (from test scenario 6)
2. Log in as admin
3. Navigate to `/dashboard/admin/reports` (if available)
4. Click on the report
5. Enter resolution text
6. Select status: "resolved" or "dismissed"
7. (Optional) Suspend user
8. Submit

**Expected Results:**
- ✓ Report status changes to selected status
- ✓ Resolution text saved
- ✓ If suspended, user's provider_status changes to 'suspended'
- ✓ Notifications sent to reporter and reported user

### 10. Auto-Close Prevention

**Steps:**
1. Create a dispute for request A
2. Wait for cron job that auto-closes completed requests
3. Check request status

**Expected Results:**
- ✓ Request is NOT auto-closed
- ✓ Request remains in 'disputed' status
- ✓ Cron job skips this request

## API Testing

### List All Disputes
```bash
curl http://localhost:3000/api/v1/test/disputes?limit=20&offset=0
```

### List All Reports
```bash
curl http://localhost:3000/api/v1/test/reports?limit=20&offset=0
```

### Get Dispute Details (Admin)
```bash
curl http://localhost:3000/api/v1/admin/disputes/DISPUTE_UUID \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

### Get User Reports (Admin)
```bash
curl http://localhost:3000/api/v1/users/USER_UUID/report \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

## Email Testing

### Verify Email Sent
1. Check Resend dashboard at https://resend.com
2. Look for emails with subject:
   - "Спор е отворен" (for providers)
   - "Нов спор" (for admins)
   - "Нов доклад" (for admins on user reports)

### Test Email Template Rendering
```bash
npx react-email preview src/emails/DisputeOpened.tsx
```

## Database Verification

### Check Disputes Table
```sql
SELECT * FROM disputes ORDER BY created_at DESC LIMIT 10;
```

### Check Dispute Evidence
```sql
SELECT * FROM dispute_evidence ORDER BY created_at DESC LIMIT 10;
```

### Check User Reports
```sql
SELECT * FROM user_reports ORDER BY created_at DESC LIMIT 10;
```

### Check Request Status Updates
```sql
SELECT id, status, dispute_id, disputed_at FROM requests 
WHERE dispute_id IS NOT NULL 
ORDER BY disputed_at DESC LIMIT 10;
```

## Notification Verification

### Check In-App Notifications
```sql
SELECT * FROM notifications 
WHERE type IN ('dispute_opened', 'dispute_resolved') 
ORDER BY created_at DESC LIMIT 10;
```

### Check Email Log
```sql
SELECT * FROM email_log 
WHERE type IN ('dispute_opened', 'dispute_resolved') 
ORDER BY created_at DESC LIMIT 10;
```

## Performance Testing

### Load Test: Create Multiple Disputes
```bash
for i in {1..100}; do
  curl -X POST http://localhost:3000/api/v1/test/disputes \
    -H "Content-Type: application/json" \
    -d "{
      \"requestId\": \"REQUEST_$i\",
      \"customerId\": \"CUSTOMER_UUID\",
      \"providerId\": \"PROVIDER_UUID\",
      \"reason\": \"incomplete_work\"
    }"
done
```

### Check Query Performance
```sql
-- Check indexes
SELECT * FROM pg_indexes WHERE tablename IN ('disputes', 'user_reports', 'dispute_evidence');

-- Check slow queries
SELECT query, calls, mean_time FROM pg_stat_statements 
WHERE query LIKE '%disputes%' OR query LIKE '%user_reports%'
ORDER BY mean_time DESC;
```

## Troubleshooting

### Dispute Not Created
1. Check if request exists and is in 'completed' status
2. Check if 48-hour window is still open
3. Check if dispute already exists for this request
4. Check database logs for errors

### Email Not Sent
1. Verify Resend API key is set
2. Check email_log table for failed entries
3. Check Resend dashboard for delivery status
4. Verify email addresses in profiles table

### Admin Can't Resolve Dispute
1. Verify user has admin role in profiles table
2. Check if dispute exists
3. Check if dispute status is 'open'
4. Check authorization token

### Notifications Not Created
1. Verify notifications table exists
2. Check if user IDs are valid
3. Check notification_log for errors
4. Verify RLS policies allow insert

## Acceptance Criteria Checklist

- [ ] POST /dispute only allowed in 'completed' status
- [ ] POST /dispute only allowed within 48 hours
- [ ] Dispute creation sets request status to 'disputed'
- [ ] Dispute creation cancels auto-close for request
- [ ] Report stored in database
- [ ] Admin notified by email on new report
- [ ] Dispute appears in admin dashboard
- [ ] Admin can resolve dispute
- [ ] Both parties notified on resolution
- [ ] Request status updated on resolution
- [ ] Evidence can be uploaded (future)
- [ ] All operations logged with timestamps
- [ ] RLS policies prevent unauthorized access
- [ ] Pagination works on admin pages
- [ ] Filters work on admin pages
