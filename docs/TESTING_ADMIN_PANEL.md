# Admin Panel Testing Guide

## Prerequisites

1. Admin user account created with `role = 'admin'`
2. Test users created (customer, provider, admin)
3. Test requests in various statuses
4. Test disputes created
5. Stripe test keys configured
6. Resend API key configured

## Test Scenarios

### 1. Admin Access Control

#### Test: Non-Admin Cannot Access Admin Panel
**Steps:**
1. Log in as customer user
2. Try to navigate to `/admin`
3. Try to access `/admin/users`
4. Try to access `/admin/disputes`

**Expected Results:**
- ✓ Redirected to `/sign-in`
- ✓ Cannot access admin routes
- ✓ Error message displayed

#### Test: Admin Can Access Admin Panel
**Steps:**
1. Log in as admin user
2. Navigate to `/admin`
3. Navigate to `/admin/users`
4. Navigate to `/admin/disputes`

**Expected Results:**
- ✓ Can access all admin routes
- ✓ Dashboard loads with stats
- ✓ Sidebar navigation visible
- ✓ All pages load correctly

### 2. Dashboard

#### Test: Dashboard Stats Load
**Steps:**
1. Log in as admin
2. Navigate to `/admin`
3. Wait for stats to load

**Expected Results:**
- ✓ Stats load without errors
- ✓ All metrics display correctly
- ✓ Numbers are accurate
- ✓ Quick action cards visible

#### Test: Dashboard Links Work
**Steps:**
1. Click on "Очаквани одобрения" card
2. Verify redirected to users list with pending filter
3. Click on "Отворени спорове" card
4. Verify redirected to disputes list

**Expected Results:**
- ✓ Links navigate correctly
- ✓ Filters applied automatically
- ✓ Correct data displayed

### 3. User Management

#### Test: View Users List
**Steps:**
1. Navigate to `/admin/users`
2. Wait for users to load
3. Verify table displays users

**Expected Results:**
- ✓ Users list loads
- ✓ Table shows: name, email, role, status
- ✓ Pagination works
- ✓ Status badges display correctly

#### Test: Search Users
**Steps:**
1. Enter search term in search box
2. Wait for results to filter
3. Try different search terms

**Expected Results:**
- ✓ Search filters by name
- ✓ Search filters by email
- ✓ Results update in real-time
- ✓ Pagination resets

#### Test: Filter by Role
**Steps:**
1. Select "Доставчик" from role filter
2. Verify only providers display
3. Select "Клиент"
4. Verify only customers display

**Expected Results:**
- ✓ Filter works correctly
- ✓ Only selected role displays
- ✓ Pagination updates
- ✓ Reset button clears filters

#### Test: Filter by Status
**Steps:**
1. Select "Очаква одобрение" from status filter
2. Verify only pending providers display
3. Try other status filters

**Expected Results:**
- ✓ Filter works correctly
- ✓ Only selected status displays
- ✓ Pagination updates

#### Test: View User Details
**Steps:**
1. Click "Преглед" link on a user
2. Wait for user details to load
3. Verify information displays

**Expected Results:**
- ✓ User detail page loads
- ✓ All user information displays
- ✓ Recent requests shown
- ✓ Action buttons visible

#### Test: Approve Provider
**Steps:**
1. Navigate to user detail for pending provider
2. Click "Одобри доставчик" button
3. Wait for success message
4. Verify user status changed

**Expected Results:**
- ✓ Button disabled during submission
- ✓ Success message displayed
- ✓ Provider status changed to "Одобрен"
- ✓ Email sent to provider
- ✓ In-app notification created

**Verify Email:**
```bash
# Check Resend dashboard for email with subject:
# "Вашата кандидатура е одобрена"
```

#### Test: Suspend User
**Steps:**
1. Navigate to user detail for active user
2. Enter suspension reason
3. Click "Спрете потребител" button
4. Wait for success message

**Expected Results:**
- ✓ Reason field required
- ✓ Button disabled during submission
- ✓ Success message displayed
- ✓ User status changed to "Спрян"
- ✓ is_blocked set to true

**Verify Suspension:**
```bash
# Try API call as suspended user:
curl http://localhost:3000/api/v1/requests \
  -H "Authorization: Bearer SUSPENDED_USER_TOKEN"

# Should return 403 Forbidden
```

#### Test: Unsuspend User
**Steps:**
1. Navigate to suspended user detail
2. Click "Възстановете потребител" button
3. Wait for success message

**Expected Results:**
- ✓ Button visible for suspended users
- ✓ Success message displayed
- ✓ User status changed to "Активен"
- ✓ is_blocked set to false
- ✓ User can access API again

#### Test: Ban User
**Steps:**
1. Navigate to user detail
2. Enter ban reason
3. Click "Забранете потребител" button
4. Wait for success message

**Expected Results:**
- ✓ Reason field required
- ✓ Success message displayed
- ✓ User status changed to "Забранен"
- ✓ is_banned set to true
- ✓ is_blocked set to true

### 4. Regions Management

#### Test: Add Region
**Steps:**
1. Navigate to `/admin/regions`
2. Enter region name: "Варна"
3. Enter region code: "VAR"
4. Click "Добавяне на регион"

**Expected Results:**
- ✓ Form submits successfully
- ✓ Success message displayed
- ✓ Region appears in list
- ✓ Form clears

#### Test: View Regions
**Steps:**
1. Navigate to `/admin/regions`
2. Wait for regions to load
3. Verify table displays regions

**Expected Results:**
- ✓ All regions display
- ✓ Table shows: name, code, created_at
- ✓ Regions sorted by name

### 5. Categories Management

#### Test: Add Category
**Steps:**
1. Navigate to `/admin/categories`
2. Enter category name: "Почистване"
3. Enter description: "Услуги за почистване"
4. Enter icon: "broom"
5. Click "Добавяне на категория"

**Expected Results:**
- ✓ Form submits successfully
- ✓ Success message displayed
- ✓ Category appears in list
- ✓ Form clears

#### Test: View Categories
**Steps:**
1. Navigate to `/admin/categories`
2. Wait for categories to load
3. Verify table displays categories

**Expected Results:**
- ✓ All categories display
- ✓ Table shows: name, description, icon
- ✓ Categories sorted by name

### 6. Disputes Management

#### Test: View Disputes List
**Steps:**
1. Navigate to `/admin/disputes`
2. Wait for disputes to load
3. Verify table displays disputes

**Expected Results:**
- ✓ Disputes list loads
- ✓ Table shows: reason, status, opened date
- ✓ Status badges display correctly
- ✓ Pagination works

#### Test: Filter Disputes by Status
**Steps:**
1. Select "Отворени" from status filter
2. Verify only open disputes display
3. Try other status filters

**Expected Results:**
- ✓ Filter works correctly
- ✓ Only selected status displays
- ✓ Pagination updates

#### Test: View Dispute Details
**Steps:**
1. Click "Преглед" on a dispute
2. Wait for details to load
3. Verify all information displays

**Expected Results:**
- ✓ Dispute detail page loads
- ✓ All dispute info displays
- ✓ Participants shown
- ✓ Request details shown
- ✓ Evidence files listed

#### Test: Resolve Dispute - Provider Wins
**Steps:**
1. Navigate to open dispute detail
2. Select "Доставчик" as winner
3. Enter resolution text
4. Click "Разрешете спор"

**Expected Results:**
- ✓ Form submits successfully
- ✓ Success message displayed
- ✓ Dispute status changed to "Разрешен"
- ✓ Request status changed to "closed"
- ✓ Stripe payment captured
- ✓ Payout record created
- ✓ Notifications sent to both parties

**Verify Payment Capture:**
```bash
# Check Stripe dashboard for successful capture
# Check payouts table for new record
SELECT * FROM payouts WHERE dispute_id = 'DISPUTE_ID';
```

#### Test: Resolve Dispute - Customer Wins
**Steps:**
1. Navigate to open dispute detail
2. Select "Клиент" as winner
3. Enter refund amount
4. Enter resolution text
5. Click "Разрешете спор"

**Expected Results:**
- ✓ Form submits successfully
- ✓ Success message displayed
- ✓ Dispute status changed to "Разрешен"
- ✓ Request status changed to "cancelled"
- ✓ Stripe refund processed
- ✓ Notifications sent to both parties

**Verify Refund:**
```bash
# Check Stripe dashboard for successful refund
# Check refunds in Stripe
```

### 7. Security Tests

#### Test: API Authorization
**Steps:**
1. Try to call `/api/v1/admin/users` without token
2. Try to call with invalid token
3. Try to call as non-admin user

**Expected Results:**
- ✓ Returns 401 Unauthorized without token
- ✓ Returns 401 with invalid token
- ✓ Returns 403 Forbidden for non-admin

#### Test: Admin Log Audit Trail
**Steps:**
1. Approve a provider
2. Suspend a user
3. Resolve a dispute
4. Check admin_logs table

**Expected Results:**
- ✓ All actions logged
- ✓ Includes admin ID, action, target, timestamp
- ✓ Dispute resolutions include details

### 8. Performance Tests

#### Test: Large User List
**Steps:**
1. Create 1000+ test users
2. Navigate to `/admin/users`
3. Test pagination with large dataset
4. Test search performance

**Expected Results:**
- ✓ Page loads within 2 seconds
- ✓ Pagination works smoothly
- ✓ Search is responsive
- ✓ No N+1 queries

#### Test: Large Disputes List
**Steps:**
1. Create 500+ test disputes
2. Navigate to `/admin/disputes`
3. Test filtering performance
4. Test pagination

**Expected Results:**
- ✓ Page loads within 2 seconds
- ✓ Filtering is responsive
- ✓ Pagination works smoothly

## Database Verification

### Check Admin Actions
```sql
SELECT * FROM admin_logs 
ORDER BY created_at DESC LIMIT 20;
```

### Check User Status Changes
```sql
SELECT id, full_name, provider_status, is_blocked, is_banned 
FROM profiles 
WHERE role = 'provider' 
ORDER BY updated_at DESC LIMIT 10;
```

### Check Dispute Resolutions
```sql
SELECT * FROM disputes 
WHERE status = 'resolved' 
ORDER BY resolved_at DESC LIMIT 10;
```

### Check Payouts
```sql
SELECT * FROM payouts 
ORDER BY created_at DESC LIMIT 10;
```

### Check Notifications
```sql
SELECT * FROM notifications 
WHERE type IN ('provider_approved', 'dispute_resolved') 
ORDER BY created_at DESC LIMIT 20;
```

## Acceptance Criteria Checklist

- [ ] Non-admin users cannot access /admin routes
- [ ] Admin users can access all admin pages
- [ ] Admin can approve pending providers
- [ ] Approval email sent to provider
- [ ] Provider status updated to 'approved'
- [ ] Admin can suspend users
- [ ] Suspended users cannot access API (403)
- [ ] Admin can unsuspend users
- [ ] Admin can ban users
- [ ] Admin can view all users with pagination
- [ ] Admin can search and filter users
- [ ] Admin can view disputes with pagination
- [ ] Admin can filter disputes by status
- [ ] Admin can resolve disputes
- [ ] Provider wins: Stripe captures payment
- [ ] Customer wins: Stripe refund processed
- [ ] Both parties notified on resolution
- [ ] Admin can add regions
- [ ] Admin can add categories
- [ ] All admin actions logged
- [ ] Authorization checks on all endpoints
- [ ] Performance acceptable with large datasets

## Troubleshooting

### Admin Page Blank
1. Check browser console for errors
2. Verify auth token is valid
3. Check network tab for failed requests
4. Clear cache and reload

### Stats Not Loading
1. Verify database connection
2. Check API endpoint is working
3. Verify user has admin role
4. Check Supabase RLS policies

### User Approval Not Working
1. Verify user exists and is provider
2. Check provider_status is 'pending'
3. Verify Resend API key configured
4. Check email_log for errors

### Dispute Resolution Failed
1. Verify dispute exists and is open
2. Check Stripe API key configured
3. Verify payment intent exists
4. Check Stripe dashboard for errors

### Suspension Not Working
1. Verify is_blocked field updated
2. Check API middleware checks is_blocked
3. Verify user token is refreshed
4. Check user can't access endpoints
