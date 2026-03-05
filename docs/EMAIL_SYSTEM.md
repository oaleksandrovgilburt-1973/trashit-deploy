# TRASHit Email Notification System

Complete documentation for the email notification system using Resend and React Email templates.

## Overview

The email notification system sends transactional emails for all major events in the TRASHit platform:

- Request created
- Request accepted
- Job started
- Job completed
- Job closed
- Dispute opened
- New message
- Provider approved

Each email is accompanied by an in-app notification and logged for audit purposes.

## Architecture

### Components

1. **Email Templates** (`/src/emails/`)
   - React Email components for each notification type
   - All templates in Bulgarian language
   - Responsive design for mobile and desktop

2. **Resend Integration** (`/src/lib/notifications/resend.ts`)
   - Centralized email sender
   - Template rendering with React Email
   - Error handling and logging

3. **In-App Notifications** (`/src/lib/notifications/inApp.ts`)
   - Database storage in `notifications` table
   - Read/unread tracking
   - Pagination support

4. **Notification Sender** (`/src/lib/notifications/sender.ts`)
   - High-level API for sending notifications
   - Combines email + in-app notifications
   - Event-specific helpers

5. **API Endpoints** (`/src/app/api/v1/notifications/`)
   - GET: Fetch notifications with pagination
   - PUT: Mark as read
   - DELETE: Delete notification

6. **UI Components**
   - `NotificationBell.tsx`: Dropdown bell icon in navbar
   - `/dashboard/notifications/page.tsx`: Full notifications dashboard

## Email Templates

### 1. RequestCreated.tsx
Sent when a customer creates a new service request.

**Recipients:** Customer
**Content:**
- Request description
- Address
- Region
- Price offer
- Link to request details

### 2. RequestAccepted.tsx
Sent when a provider accepts a customer's request.

**Recipients:** Customer
**Content:**
- Provider name and phone
- Request description
- Address
- Link to chat

### 3. JobStarted.tsx
Sent when a provider starts working on a job.

**Recipients:** Customer
**Content:**
- Provider name
- Request description
- Address
- Link to chat

### 4. JobCompleted.tsx
Sent when a provider completes a job and uploads proof photos.

**Recipients:** Customer
**Content:**
- Provider name
- Request description
- Completion notes
- Link to review

### 5. JobClosed.tsx
Sent when a customer confirms completion and payment is captured.

**Recipients:** Provider
**Content:**
- Request description
- Payment amount
- Link to dashboard

### 6. DisputeOpened.tsx
Sent when a dispute is opened.

**Recipients:** Admin, Provider
**Content:**
- Dispute reason
- Other party name
- Link to dispute details

### 7. NewMessage.tsx
Sent when a new message is received in a request chat.

**Recipients:** Message recipient
**Content:**
- Sender name
- Message preview
- Link to chat

### 8. ProviderApproved.tsx
Sent when a provider's profile is approved by admin.

**Recipients:** Provider
**Content:**
- Approval confirmation
- Link to dashboard

## Database Schema

### notifications table
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE
);
```

### email_log table
```sql
CREATE TABLE email_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  email_address TEXT NOT NULL,
  type VARCHAR(50) NOT NULL,
  subject TEXT NOT NULL,
  resend_id TEXT,
  status VARCHAR(50) DEFAULT 'sent',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Setup Instructions

### 1. Install Dependencies

```bash
npm install resend @react-email/components @react-email/render
```

### 2. Configure Environment Variables

Add to `.env.local`:

```env
# Resend API Key (get from https://resend.com)
RESEND_API_KEY=re_xxxxxxxxxxxxx

# App URL for email links
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Run Database Migrations

Execute the migration file in Supabase SQL Editor:

```sql
-- Run /supabase/migrations/013_notifications.sql
```

### 4. Test Email Templates

#### Option A: Using React Email Preview

```bash
npx react-email preview
```

This opens a preview server at `http://localhost:3000` where you can see all email templates.

#### Option B: Using Test Endpoint

Send a POST request to test the email system:

```bash
curl -X POST http://localhost:3000/api/v1/test/send-email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "type": "request_created"
  }'
```

Available email types:
- `request_created`
- `request_accepted`
- `job_started`
- `job_completed`
- `job_closed`
- `dispute_opened`
- `new_message`
- `provider_approved`

## Usage Examples

### Send Email and In-App Notification

```typescript
import { sendNotification } from '@/lib/notifications/sender';

await sendNotification({
  userId: customerId,
  type: 'request_created',
  emailType: 'request_created',
  title: 'Вашата заявка е създадена',
  message: 'Вашата заявка е успешно създадена.',
  emailData: {
    customerName: 'Иван Петров',
    requestDescription: 'Отвоз на боклук',
    requestAddress: 'ул. Васил Левски 42',
    region: 'Лозенец',
    price: '50',
    requestUrl: 'http://localhost:3000/requests/123',
  },
  inAppData: {
    requestId: '123',
    description: 'Отвоз на боклук',
  },
});
```

### Use Helper Functions

```typescript
import { notifyRequestCreated, notifyRequestAccepted } from '@/lib/notifications/sender';

// When request is created
await notifyRequestCreated(customerId, requestId, {
  description: 'Отвоз на боклук',
  address: 'ул. Васил Левски 42',
  region: 'Лозенец',
  price: 50,
});

// When request is accepted
await notifyRequestAccepted(customerId, providerId, requestId, {
  description: 'Отвоз на боклук',
  address: 'ул. Васил Левски 42',
}, {
  name: 'Марин Иванов',
  phone: '+359 88 123 4567',
});
```

### Fetch User Notifications

```typescript
import { getNotifications, getUnreadCount } from '@/lib/notifications/inApp';

// Get paginated notifications
const result = await getNotifications(userId, limit = 20, offset = 0);

// Get unread count
const unread = await getUnreadCount(userId);
```

### Mark Notification as Read

```typescript
import { markNotificationAsRead } from '@/lib/notifications/inApp';

await markNotificationAsRead(notificationId);
```

## API Endpoints

### GET /api/v1/notifications

Fetch notifications for the current user.

**Query Parameters:**
- `limit`: Number of notifications (default: 20, max: 100)
- `offset`: Pagination offset (default: 0)
- `unread_only`: Return only unread (default: false)
- `action`: Special action (`mark_all_read`, `unread_count`)

**Example:**

```bash
curl http://localhost:3000/api/v1/notifications?limit=10&offset=0 \
  -H "Authorization: Bearer {token}"
```

**Response:**

```json
{
  "notifications": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "type": "request_created",
      "title": "Вашата заявка е създадена",
      "message": "Вашата заявка е успешно създадена.",
      "data": {...},
      "read": false,
      "created_at": "2024-01-15T10:30:00Z",
      "read_at": null
    }
  ],
  "total": 42,
  "limit": 10,
  "offset": 0
}
```

### PUT /api/v1/notifications

Mark a notification as read.

**Body:**

```json
{
  "id": "notification-uuid",
  "read": true
}
```

### DELETE /api/v1/notifications

Delete a notification.

**Body:**

```json
{
  "id": "notification-uuid"
}
```

## Monitoring and Debugging

### Email Log

View all sent emails in the `email_log` table:

```sql
SELECT * FROM email_log
ORDER BY created_at DESC
LIMIT 50;
```

### Check Failed Emails

```sql
SELECT * FROM email_log
WHERE status = 'failed'
ORDER BY created_at DESC;
```

### View Notifications

```sql
SELECT * FROM notifications
WHERE user_id = 'user-uuid'
ORDER BY created_at DESC;
```

## Best Practices

1. **Always use helper functions** from `sender.ts` for consistency
2. **Test emails in development** using the test endpoint
3. **Monitor email logs** for delivery failures
4. **Debounce message notifications** to avoid spam (max 1 per 15 min per thread)
5. **Keep email templates simple** - focus on clarity and action
6. **Use Bulgarian language** throughout all templates and content
7. **Include direct links** in emails for easy navigation
8. **Test responsive design** on mobile devices

## Troubleshooting

### Emails not sending

1. Check `RESEND_API_KEY` is set correctly
2. Verify email address is valid
3. Check `email_log` table for error messages
4. Ensure Resend account has sufficient credits

### Templates not rendering

1. Verify React Email components are imported correctly
2. Check template props match the data being passed
3. Test with React Email preview server
4. Check browser console for errors

### In-app notifications not appearing

1. Verify `notifications` table has RLS policies enabled
2. Check user has permission to read their own notifications
3. Verify notification was created in database
4. Check API endpoint returns data correctly

## Future Enhancements

- [ ] SMS notifications for urgent events
- [ ] Push notifications for mobile app
- [ ] Email digest (daily/weekly summary)
- [ ] Notification preferences per user
- [ ] Notification templates customization
- [ ] Email analytics and tracking
- [ ] Retry logic for failed emails
- [ ] Batch email sending for performance

## Support

For issues or questions about the email system:

1. Check the troubleshooting section above
2. Review the email logs in the database
3. Test with the test endpoint
4. Check Resend dashboard for account issues
