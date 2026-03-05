# Admin Panel Documentation

## Overview

The Admin Panel is a comprehensive management interface for TRASHit administrators. It provides tools for user management, provider approvals, dispute resolution, and platform configuration.

## Access Control

### Authentication
- Admin panel is protected by role-based access control (RBAC)
- Only users with `role = 'admin'` can access `/admin/*` routes
- Non-admin users are redirected to `/sign-in`
- All API endpoints verify admin role before processing

### Layout & Navigation
**Location:** `src/app/(admin)/layout.tsx`

The admin layout wraps all admin pages with:
- Authentication check
- Admin role verification
- Responsive sidebar navigation
- Mobile-friendly menu toggle

**Sidebar Component:** `src/components/admin/AdminSidebar.tsx`

Navigation items:
- Панел (Dashboard)
- Потребители (Users)
- Региони (Regions)
- Категории (Categories)
- Спорове (Disputes)

## Dashboard

**Location:** `src/app/(admin)/page.tsx`

### Features
- Summary statistics with key metrics
- Quick action cards for pending approvals and disputes
- Real-time data fetching
- Clickable stat cards linking to detail pages

### Metrics Displayed
- Total users count
- Pending provider applications
- Suspended users count
- Open disputes count
- Total requests count
- Completed requests count

### API Endpoint
```
GET /api/v1/admin/stats
Authorization: Bearer {token}

Response:
{
  "totalUsers": 150,
  "pendingProviders": 5,
  "suspendedUsers": 2,
  "openDisputes": 3,
  "totalRequests": 500,
  "completedRequests": 450
}
```

## User Management

### Users List Page
**Location:** `src/app/(admin)/users/page.tsx`

#### Features
- Searchable user list with pagination
- Filter by role (customer, provider, admin)
- Filter by status (pending, approved, suspended, banned)
- Status badges showing user state
- Quick links to user detail pages

#### Filters
- **Search:** By name or email
- **Role:** Customer, Provider, Admin
- **Status:** Pending, Approved, Suspended, Banned

#### Pagination
- 20 users per page
- Previous/Next navigation
- Page indicator

### User Detail Page
**Location:** `src/app/(admin)/users/[id]/page.tsx`

#### Information Displayed
- User name, email, phone
- Role and provider status
- Account status (active, suspended, banned)
- Registration date
- Recent requests

#### Admin Actions
1. **Approve Provider** (for pending providers)
   - Sets `provider_status = 'approved'`
   - Sends approval email
   - Updates JWT custom claims on next login

2. **Suspend User**
   - Sets `is_blocked = true`
   - Requires suspension reason
   - User cannot access API endpoints

3. **Unsuspend User**
   - Restores `is_blocked = false`
   - Clears suspension reason
   - User regains access

4. **Ban User**
   - Sets `is_banned = true`
   - Permanent action
   - Requires ban reason
   - User cannot use platform

### API Endpoints

#### Get Users List
```
GET /api/v1/admin/users?role=provider&status=pending&search=john&limit=20&offset=0
Authorization: Bearer {token}

Response:
{
  "users": [...],
  "total": 150,
  "limit": 20,
  "offset": 0
}
```

#### Get User Details
```
GET /api/v1/admin/users/[id]
Authorization: Bearer {token}

Response:
{
  "user": { ... },
  "requests": [...]
}
```

#### Update User Status
```
PATCH /api/v1/admin/users/[id]
Authorization: Bearer {token}

Body:
{
  "action": "approve" | "suspend" | "unsuspend" | "ban",
  "reason": "optional reason"
}

Response:
{
  "success": true,
  "user": { ... },
  "message": "User successfully approved"
}
```

## Regions Management

**Location:** `src/app/(admin)/regions/page.tsx`

### Features
- Add new regions
- View all regions
- Region code management
- Creation date tracking

### Form Fields
- **Name:** Region name (required)
- **Code:** Region code (required)

### API Endpoints

#### Get Regions
```
GET /api/v1/admin/regions
Authorization: Bearer {token}

Response:
{
  "regions": [
    {
      "id": "uuid",
      "name": "Sofia",
      "code": "SOF",
      "created_at": "2026-03-05T..."
    }
  ]
}
```

#### Create Region
```
POST /api/v1/admin/regions
Authorization: Bearer {token}

Body:
{
  "name": "Sofia",
  "code": "SOF"
}

Response:
{
  "success": true,
  "region": { ... }
}
```

## Categories Management

**Location:** `src/app/(admin)/categories/page.tsx`

### Features
- Add new service categories
- View all categories
- Category descriptions and icons
- Creation date tracking

### Form Fields
- **Name:** Category name (required)
- **Description:** Category description (optional)
- **Icon:** Icon identifier (optional)

### API Endpoints

#### Get Categories
```
GET /api/v1/admin/categories
Authorization: Bearer {token}

Response:
{
  "categories": [
    {
      "id": "uuid",
      "name": "Cleaning",
      "description": "Cleaning services",
      "icon": "broom",
      "created_at": "2026-03-05T..."
    }
  ]
}
```

#### Create Category
```
POST /api/v1/admin/categories
Authorization: Bearer {token}

Body:
{
  "name": "Cleaning",
  "description": "Cleaning services",
  "icon": "broom"
}

Response:
{
  "success": true,
  "category": { ... }
}
```

## Disputes Management

### Disputes List Page
**Location:** `src/app/(admin)/disputes/page.tsx`

#### Features
- List all disputes with status
- Filter by status (open, resolved, closed)
- Pagination support
- Quick links to detail pages

#### Status Badges
- **Open:** Red badge - awaiting resolution
- **Resolved:** Green badge - resolved
- **Closed:** Gray badge - closed

### Dispute Detail Page
**Location:** `src/app/(admin)/disputes/[id]/page.tsx`

#### Information Displayed
- Dispute reason and description
- Dispute status and timeline
- Participants (opened by, opened against)
- Request details
- Evidence files

#### Resolution Form (for open disputes)
- **Winner Selection:** Provider or Customer
- **Refund Amount:** For customer wins
- **Resolution Text:** Detailed explanation
- **Submit Button:** Resolves dispute

#### Payment Handling
1. **Provider Wins:**
   - Stripe payment is captured
   - Payout record created
   - Request status → 'closed'

2. **Customer Wins:**
   - Stripe refund is processed
   - Refund amount specified
   - Request status → 'cancelled'

### API Endpoints

#### Get Disputes List
```
GET /api/v1/admin/disputes?status=open&limit=20&offset=0
Authorization: Bearer {token}

Response:
{
  "disputes": [...],
  "total": 50,
  "limit": 20,
  "offset": 0
}
```

#### Get Dispute Details
```
GET /api/v1/admin/disputes/[id]
Authorization: Bearer {token}

Response:
{
  "dispute": { ... },
  "evidence": [...]
}
```

#### Resolve Dispute
```
PUT /api/v1/admin/disputes/[id]/resolve
Authorization: Bearer {token}

Body:
{
  "resolution": "Detailed resolution text",
  "status": "resolved" | "closed",
  "refund_amount": 0 (optional)
}

Response:
{
  "success": true,
  "dispute": { ... },
  "message": "Dispute successfully resolved"
}
```

#### Update Dispute Status
```
PATCH /api/v1/admin/disputes/[id]
Authorization: Bearer {token}

Body:
{
  "status": "resolved" | "closed",
  "resolution": "optional resolution text"
}

Response:
{
  "success": true,
  "dispute": { ... }
}
```

## Security Features

### Row Level Security (RLS)
- All admin tables have RLS policies
- Only admins can read/write admin data
- User data access restricted to own records

### Authorization Checks
- Every endpoint verifies admin role
- Token validation on all requests
- Admin actions logged to audit trail

### Audit Logging
- All admin actions logged to `admin_logs` table
- Includes: admin ID, action, target user, timestamp
- Dispute resolutions logged with details

## Best Practices

### Provider Approvals
1. Review provider profile and documents
2. Verify contact information
3. Check for any reports or disputes
4. Approve or request more information
5. Send approval email notification

### Dispute Resolution
1. Review all evidence provided
2. Contact both parties if needed
3. Make fair decision based on facts
4. Document resolution thoroughly
5. Process payment accordingly

### User Management
1. Monitor user reports and complaints
2. Suspend users with violations
3. Ban repeat offenders
4. Document all actions with reasons
5. Review suspension decisions regularly

## Testing Checklist

### Admin Access
- [ ] Non-admin users cannot access /admin routes
- [ ] Non-admin users redirected to sign-in
- [ ] Admin users can access all admin pages
- [ ] Sidebar navigation works correctly

### User Management
- [ ] Can view all users with pagination
- [ ] Can filter by role and status
- [ ] Can search by name and email
- [ ] Can approve pending providers
- [ ] Approval email sent to provider
- [ ] Can suspend users
- [ ] Suspended users cannot access API
- [ ] Can unsuspend users
- [ ] Can ban users

### Disputes
- [ ] Can view all disputes
- [ ] Can filter by status
- [ ] Can view dispute details
- [ ] Can view evidence files
- [ ] Can resolve disputes
- [ ] Provider wins: payment captured
- [ ] Customer wins: refund processed
- [ ] Both parties notified on resolution

### Regions & Categories
- [ ] Can add new regions
- [ ] Can view all regions
- [ ] Can add new categories
- [ ] Can view all categories

## Troubleshooting

### Admin Cannot Access Panel
1. Verify user role is 'admin' in profiles table
2. Check authentication token is valid
3. Clear browser cache and cookies
4. Try logging out and back in

### Approval Email Not Sent
1. Verify Resend API key is configured
2. Check email_log table for failures
3. Verify provider email address is valid
4. Check Resend dashboard for delivery status

### Dispute Resolution Failed
1. Verify Stripe API key is configured
2. Check payment intent exists and is valid
3. Verify request amount matches
4. Check Stripe dashboard for errors

### User Suspension Not Working
1. Verify is_blocked field is updated
2. Check API middleware checks is_blocked
3. Verify user token is refreshed
4. Check user can't access protected endpoints

## Future Enhancements

1. **Advanced Analytics**
   - User growth charts
   - Revenue analytics
   - Dispute resolution metrics

2. **Bulk Actions**
   - Bulk approve providers
   - Bulk suspend users
   - Bulk export data

3. **Custom Reports**
   - Generate CSV exports
   - Scheduled email reports
   - Custom date ranges

4. **Automated Actions**
   - Auto-suspend on report threshold
   - Auto-ban repeat offenders
   - Auto-refund disputed amounts

5. **Communication Tools**
   - Send messages to users
   - Broadcast announcements
   - Email templates
