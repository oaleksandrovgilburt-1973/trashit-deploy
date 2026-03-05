# Disputes & Reports System Documentation

## Overview

The Disputes & Reports system enables customers to open disputes for completed jobs and users to report each other for inappropriate behavior. The system includes:

- **Dispute Management**: Customers can open disputes within 48 hours of job completion
- **Evidence Tracking**: Both parties can upload evidence to support their case
- **Admin Resolution**: Administrators can review disputes and issue resolutions
- **User Reports**: Users can report other users for fraud, harassment, etc.
- **Email Notifications**: All parties are notified via email about dispute events

## Database Schema

### Disputes Table

```sql
CREATE TABLE disputes (
  id UUID PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES requests(id),
  opened_by_id UUID NOT NULL REFERENCES profiles(id),
  opened_against_id UUID NOT NULL REFERENCES profiles(id),
  reason VARCHAR(50) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'open', -- open, resolved, closed
  resolution TEXT,
  resolved_by_id UUID REFERENCES profiles(id),
  created_at TIMESTAMP,
  resolved_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### Dispute Evidence Table

```sql
CREATE TABLE dispute_evidence (
  id UUID PRIMARY KEY,
  dispute_id UUID NOT NULL REFERENCES disputes(id),
  file_url TEXT NOT NULL,
  file_type VARCHAR(50),
  description TEXT,
  uploaded_by_id UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMP
);
```

### User Reports Table

```sql
CREATE TABLE user_reports (
  id UUID PRIMARY KEY,
  reporter_id UUID NOT NULL REFERENCES profiles(id),
  reported_user_id UUID NOT NULL REFERENCES profiles(id),
  reason VARCHAR(100) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'open', -- open, investigating, resolved, dismissed
  resolution TEXT,
  resolved_by_id UUID REFERENCES profiles(id),
  created_at TIMESTAMP,
  resolved_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

## API Endpoints

### Dispute Endpoints

#### Create Dispute
```
POST /api/v1/requests/[id]/dispute
Authorization: Bearer {token}

Body:
{
  "reason": "incomplete_work" | "poor_quality" | "no_show" | "other",
  "description": "Detailed description of the issue"
}

Response:
{
  "success": true,
  "dispute": { ... },
  "message": "Спорът е успешно отворен"
}
```

**Rules:**
- Only customer can open dispute
- Request must be in 'completed' status
- Dispute must be opened within 48 hours of completion
- No active dispute already exists for this request

#### Get Disputes for Request
```
GET /api/v1/requests/[id]/dispute
Authorization: Bearer {token}

Response:
{
  "disputes": [...]
}
```

### Admin Dispute Endpoints

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
  "resolution": "Detailed resolution",
  "status": "resolved" | "closed",
  "refund_amount": 0
}

Response:
{
  "success": true,
  "dispute": { ... },
  "message": "Спорът е успешно разрешен"
}
```

### User Report Endpoints

#### Create Report
```
POST /api/v1/users/[id]/report
Authorization: Bearer {token}

Body:
{
  "reason": "inappropriate_behavior" | "fraud" | "harassment" | "scam" | "other",
  "description": "Detailed description"
}

Response:
{
  "success": true,
  "report": { ... },
  "message": "Докладът е успешно подаден"
}
```

#### Get User Reports (Admin)
```
GET /api/v1/users/[id]/report
Authorization: Bearer {token}

Query Parameters:
- limit: 50 (default)
- offset: 0 (default)

Response:
{
  "reports": [...],
  "total": 0,
  "limit": 50,
  "offset": 0
}
```

## Helper Functions

### Dispute Helpers (`src/lib/disputes.ts`)

```typescript
// Check if dispute can be opened
canOpenDispute(requestId: string): Promise<{ allowed: boolean; reason?: string }>

// Create dispute
createDispute(
  requestId: string,
  openedById: string,
  openedAgainstId: string,
  reason: string,
  description?: string
): Promise<{ success: boolean; dispute?: Dispute; error?: string }>

// Get dispute details
getDispute(disputeId: string): Promise<{ success: boolean; dispute?: Dispute; error?: string }>

// Get disputes for request
getDisputesForRequest(requestId: string): Promise<{ success: boolean; disputes?: Dispute[]; error?: string }>

// Get disputes for user
getDisputesForUser(userId: string, limit?: number, offset?: number): Promise<{ success: boolean; disputes?: Dispute[]; total?: number; error?: string }>

// Add evidence
addDisputeEvidence(
  disputeId: string,
  fileUrl: string,
  uploadedById: string,
  fileType?: string,
  description?: string
): Promise<{ success: boolean; evidence?: DisputeEvidence; error?: string }>

// Get evidence
getDisputeEvidence(disputeId: string): Promise<{ success: boolean; evidence?: DisputeEvidence[]; error?: string }>

// Resolve dispute
resolveDispute(
  disputeId: string,
  resolution: string,
  resolvedById: string,
  status?: 'resolved' | 'closed'
): Promise<{ success: boolean; dispute?: Dispute; error?: string }>

// Cancel auto-close
cancelAutoCloseForDispute(requestId: string): Promise<{ success: boolean; error?: string }>
```

### Report Helpers (`src/lib/reports.ts`)

```typescript
// Create report
createUserReport(
  reporterId: string,
  reportedUserId: string,
  reason: ReportReason,
  description?: string
): Promise<{ success: boolean; report?: UserReport; error?: string }>

// Get report
getUserReport(reportId: string): Promise<{ success: boolean; report?: UserReport; error?: string }>

// Get user reports
getUserReports(userId: string, limit?: number, offset?: number): Promise<{ success: boolean; reports?: UserReport[]; total?: number; error?: string }>

// Get open reports (admin)
getOpenReports(limit?: number, offset?: number): Promise<{ success: boolean; reports?: UserReport[]; total?: number; error?: string }>

// Resolve report
resolveUserReport(
  reportId: string,
  resolution: string,
  resolvedById: string,
  status?: 'resolved' | 'dismissed'
): Promise<{ success: boolean; report?: UserReport; error?: string }>

// Suspend user
suspendUser(userId: string, reason: string): Promise<{ success: boolean; error?: string }>

// Unsuspend user
unsuspendUser(userId: string): Promise<{ success: boolean; error?: string }>
```

## Notification Functions

### Dispute Notifications (`src/lib/notifications/sender.ts`)

```typescript
// Notify when dispute is opened
notifyDisputeOpened(
  recipientId: string,
  otherPartyName: string,
  recipientRole: 'provider' | 'admin',
  reason: string,
  requestId: string
): Promise<{ success: boolean; ... }>
```

## UI Components

### Request Detail Page
**Location:** `src/app/requests/[id]/page.tsx`

- Displays request information
- Shows dispute button for completed requests
- Shows dispute status if already disputed
- Enforces 48-hour window for dispute opening

### Dispute Creation Page
**Location:** `src/app/requests/[id]/dispute/page.tsx`

- Form to create dispute
- Reason selection
- Description textarea
- Evidence upload (future enhancement)
- Success/error messages

### Admin Disputes Dashboard
**Location:** `src/app/dashboard/admin/disputes/page.tsx`

- Lists all disputes
- Filter by status (open, resolved, all)
- Pagination
- Links to detail pages

### Admin Dispute Detail Page
**Location:** `src/app/dashboard/admin/disputes/[id]/page.tsx`

- Shows dispute details
- Displays participant information
- Shows request details
- Lists evidence
- Resolution form (for open disputes)
- Shows resolution (for resolved disputes)

## Integration Guide

### 1. Add Dispute Button to Request Detail

In your request detail page, add:

```tsx
{canOpenDispute() && (
  <Link
    href={`/requests/${requestId}/dispute`}
    className="px-4 py-2 bg-red-600 text-white rounded-lg"
  >
    Отворете спор
  </Link>
)}
```

### 2. Handle Auto-Close Cancellation

In your cron job for auto-closing requests:

```typescript
// Check if request has dispute before auto-closing
const { data: request } = await supabase
  .from('requests')
  .select('dispute_id, status')
  .eq('id', requestId)
  .single();

if (request.dispute_id || request.status === 'disputed') {
  // Skip auto-close for disputed requests
  return;
}

// Proceed with auto-close
```

### 3. Add Admin Disputes Link to Admin Dashboard

```tsx
<Link href="/dashboard/admin/disputes">
  Управление на спорове
</Link>
```

### 4. Send Notifications on Dispute Events

```typescript
// When dispute is created
await notifyDisputeOpened(
  provider.id,
  customer.full_name,
  'provider',
  reason,
  requestId
);

// Notify admins
const { data: admins } = await supabase
  .from('profiles')
  .select('id')
  .eq('role', 'admin');

for (const admin of admins) {
  await notifyDisputeOpened(
    admin.id,
    provider.full_name,
    'admin',
    reason,
    requestId
  );
}
```

## Testing Checklist

### Dispute Creation
- [ ] Customer can open dispute for completed request
- [ ] Dispute cannot be opened outside 48-hour window
- [ ] Dispute cannot be opened twice for same request
- [ ] Request status changes to 'disputed'
- [ ] Email notifications sent to provider and admins
- [ ] In-app notifications created

### Dispute Resolution
- [ ] Admin can view all disputes
- [ ] Admin can filter by status
- [ ] Admin can view dispute details with evidence
- [ ] Admin can resolve dispute with resolution text
- [ ] Request status changes to 'closed'
- [ ] Notifications sent to both parties

### Auto-Close Prevention
- [ ] Disputed requests are not auto-closed
- [ ] Cron job skips disputed requests

### User Reports
- [ ] User can report another user
- [ ] Cannot self-report
- [ ] Cannot report same user twice
- [ ] Admin can view all reports
- [ ] Admin can resolve reports
- [ ] User can be suspended/unsuspended

## Security Considerations

1. **RLS Policies**: All tables have Row Level Security enabled
2. **Admin-Only Actions**: Dispute resolution requires admin role
3. **Ownership Verification**: Users can only create disputes for requests they own
4. **Evidence Validation**: Only parties involved in dispute can upload evidence
5. **Audit Trail**: All dispute actions are logged with timestamps and user IDs

## Future Enhancements

1. **Evidence Upload**: Allow users to upload photos/documents as evidence
2. **Appeal Process**: Allow users to appeal admin decisions
3. **Mediation**: Automated mediation suggestions based on dispute reason
4. **Analytics**: Track dispute rates and resolution times
5. **Automated Refunds**: Automatically process refunds based on resolution
6. **User Suspension**: Automatically suspend users with too many disputes
