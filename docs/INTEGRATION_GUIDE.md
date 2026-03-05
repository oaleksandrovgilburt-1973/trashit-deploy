# Email Notification Integration Guide

Step-by-step guide for integrating email notifications into TRASHit API endpoints.

## Overview

This guide shows how to integrate the notification system into existing and new API endpoints. Each major event in the request lifecycle should trigger appropriate notifications.

## Events and Integration Points

### 1. Request Created

**Endpoint:** `POST /api/v1/requests`

**When:** After request is successfully created

**Integration:**

```typescript
import { notifyRequestCreated } from '@/lib/notifications/sender';

// After creating request in database
const { data: newRequest } = await supabase
  .from('requests')
  .insert({...})
  .select()
  .single();

// Send notification
if (newRequest) {
  await notifyRequestCreated(user.id, newRequest.id, {
    description: validatedData.description,
    address: validatedData.address,
    region: regionName, // Get from regions table
    price: validatedData.price_offer || 0,
  });
}
```

**Recipients:** Customer
**Email Type:** `request_created`

---

### 2. Request Accepted

**Endpoint:** `POST /api/v1/requests/[id]/accept`

**When:** After provider successfully accepts request

**Integration:**

```typescript
import { notifyRequestAccepted } from '@/lib/notifications/sender';

// After RPC accept_request succeeds
const { data: request } = await supabase
  .from('requests')
  .select('customer_id, description, address')
  .eq('id', requestId)
  .single();

const { data: provider } = await supabase
  .from('profiles')
  .select('full_name, phone')
  .eq('id', providerId)
  .single();

// Send notification
if (request && provider) {
  await notifyRequestAccepted(
    request.customer_id,
    providerId,
    requestId,
    {
      description: request.description,
      address: request.address,
    },
    {
      name: provider.full_name,
      phone: provider.phone || 'N/A',
    }
  );
}
```

**Recipients:** Customer
**Email Type:** `request_accepted`

---

### 3. Job Started

**Endpoint:** `POST /api/v1/requests/[id]/start`

**When:** After provider changes status to `in_progress`

**Integration:**

```typescript
import { notifyJobStarted } from '@/lib/notifications/sender';

// After updating request status to in_progress
const { data: request } = await supabase
  .from('requests')
  .select('customer_id, description, address')
  .eq('id', requestId)
  .single();

const { data: provider } = await supabase
  .from('profiles')
  .select('full_name')
  .eq('id', user.id)
  .single();

// Send notification
if (request && provider) {
  await notifyJobStarted(
    request.customer_id,
    user.id,
    requestId,
    {
      description: request.description,
      address: request.address,
    },
    {
      name: provider.full_name,
    }
  );
}
```

**Recipients:** Customer
**Email Type:** `job_started`

---

### 4. Job Completed

**Endpoint:** `POST /api/v1/requests/[id]/complete`

**When:** After provider uploads proof photos and marks job as completed

**Integration:**

```typescript
import { notifyJobCompleted } from '@/lib/notifications/sender';

// After updating request status to completed
const { data: request } = await supabase
  .from('requests')
  .select('customer_id, description')
  .eq('id', requestId)
  .single();

const { data: provider } = await supabase
  .from('profiles')
  .select('full_name')
  .eq('id', user.id)
  .single();

// Send notification
if (request && provider) {
  await notifyJobCompleted(
    request.customer_id,
    user.id,
    requestId,
    {
      description: request.description,
    },
    {
      name: provider.full_name,
    },
    completionNotes || 'Работата е завършена успешно.'
  );
}
```

**Recipients:** Customer
**Email Type:** `job_completed`

---

### 5. Job Closed

**Endpoint:** `POST /api/v1/requests/[id]/close`

**When:** After customer confirms completion and payment is captured

**Integration:**

```typescript
import { notifyJobClosed } from '@/lib/notifications/sender';

// After capturing payment and updating request status to closed
const { data: request } = await supabase
  .from('requests')
  .select('provider_id, description, price_offer')
  .eq('id', requestId)
  .single();

// Send notification to provider
if (request) {
  await notifyJobClosed(
    request.provider_id,
    user.id,
    requestId,
    {
      description: request.description,
    },
    request.price_offer || 0
  );
}
```

**Recipients:** Provider
**Email Type:** `job_closed`

---

### 6. Provider Approved

**Endpoint:** `POST /api/v1/admin/providers/[id]/approve`

**When:** After admin approves provider profile

**Integration:**

```typescript
import { notifyProviderApproved } from '@/lib/notifications/sender';

// After updating provider_status to approved
const { data: provider } = await supabase
  .from('profiles')
  .select('full_name')
  .eq('id', providerId)
  .single();

// Send notification
if (provider) {
  await notifyProviderApproved(providerId, provider.full_name);
}
```

**Recipients:** Provider
**Email Type:** `provider_approved`

---

### 7. New Message

**Endpoint:** `POST /api/v1/requests/[id]/messages`

**When:** After new message is sent in request chat

**Integration (with debouncing):**

```typescript
import { notifyNewMessage } from '@/lib/notifications/sender';

// After message is created
const { data: message } = await supabase
  .from('messages')
  .insert({
    request_id: requestId,
    sender_id: user.id,
    body: messageBody,
  })
  .select()
  .single();

// Get request to find recipient
const { data: request } = await supabase
  .from('requests')
  .select('customer_id, provider_id')
  .eq('id', requestId)
  .single();

// Determine recipient (opposite of sender)
const recipientId = request.customer_id === user.id 
  ? request.provider_id 
  : request.customer_id;

// Check if we should send email (debounce: max 1 per 15 min per thread)
const lastEmail = await supabase
  .from('email_log')
  .select('created_at')
  .eq('type', 'new_message')
  .eq('user_id', recipientId)
  .order('created_at', { ascending: false })
  .limit(1)
  .single();

const shouldSendEmail = !lastEmail?.data?.created_at || 
  (Date.now() - new Date(lastEmail.data.created_at).getTime()) > 15 * 60 * 1000;

if (shouldSendEmail) {
  const { data: sender } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single();

  await notifyNewMessage(
    recipientId,
    user.id,
    sender.full_name,
    requestId,
    messageBody.substring(0, 100) // Preview
  );
}
```

**Recipients:** Message recipient
**Email Type:** `new_message`
**Note:** Debounced to max 1 email per 15 minutes per request thread

---

### 8. Dispute Opened

**Endpoint:** `POST /api/v1/requests/[id]/dispute`

**When:** After customer opens dispute or cancels request

**Integration:**

```typescript
import { sendNotification } from '@/lib/notifications/sender';

// After creating dispute
const { data: request } = await supabase
  .from('requests')
  .select('customer_id, provider_id, description')
  .eq('id', requestId)
  .single();

const { data: provider } = await supabase
  .from('profiles')
  .select('full_name')
  .eq('id', request.provider_id)
  .single();

// Notify provider
await sendNotification({
  userId: request.provider_id,
  type: 'dispute_opened',
  emailType: 'dispute_opened',
  title: 'Спор е отворен',
  message: `${provider.full_name} е отворил спор по вашата работа.`,
  emailData: {
    recipientName: provider.full_name,
    recipientRole: 'provider',
    otherPartyName: 'Клиент',
    reason: disputeReason,
    dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/provider`,
  },
});

// Notify admin
const { data: admins } = await supabase
  .from('profiles')
  .select('id')
  .eq('role', 'admin');

for (const admin of admins || []) {
  await sendNotification({
    userId: admin.id,
    type: 'dispute_opened',
    emailType: 'dispute_opened',
    title: 'Нов спор',
    message: `Нов спор по заявка ${requestId}`,
    emailData: {
      recipientName: 'Администратор',
      recipientRole: 'admin',
      otherPartyName: provider.full_name,
      reason: disputeReason,
      dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/admin`,
    },
  });
}
```

**Recipients:** Provider, Admin
**Email Type:** `dispute_opened`

---

## Implementation Checklist

- [ ] Install dependencies: `npm install resend @react-email/components @react-email/render`
- [ ] Set `RESEND_API_KEY` in `.env.local`
- [ ] Run migration: `013_notifications.sql`
- [ ] Add notification imports to each endpoint
- [ ] Integrate notifications into request creation
- [ ] Integrate notifications into request acceptance
- [ ] Integrate notifications into job start
- [ ] Integrate notifications into job completion
- [ ] Integrate notifications into job closure
- [ ] Integrate notifications into provider approval
- [ ] Integrate notifications into messaging (with debouncing)
- [ ] Integrate notifications into disputes
- [ ] Add NotificationBell to navbar
- [ ] Test all email templates
- [ ] Verify email logs in database
- [ ] Test in-app notifications UI

## Testing

### Test Email Delivery

```bash
curl -X POST http://localhost:3000/api/v1/test/send-email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@example.com",
    "type": "request_created"
  }'
```

### Check Email Logs

```sql
SELECT * FROM email_log
WHERE user_id = 'user-uuid'
ORDER BY created_at DESC
LIMIT 20;
```

### Check In-App Notifications

```sql
SELECT * FROM notifications
WHERE user_id = 'user-uuid'
ORDER BY created_at DESC
LIMIT 20;
```

## Error Handling

All notification functions return a result object:

```typescript
{
  success: boolean,
  email?: { success: boolean, id?: string, error?: string },
  notification?: { success: boolean, error?: string }
}
```

Example error handling:

```typescript
const result = await notifyRequestCreated(customerId, requestId, data);

if (!result.success) {
  console.error('Notification failed:', result);
  // Log to error tracking service
  // Don't fail the API request - notifications are non-critical
}
```

## Performance Considerations

1. **Async notifications:** All notifications are sent asynchronously, don't block API responses
2. **Debouncing:** Message notifications are debounced to prevent spam
3. **Batch operations:** Use `createNotificationsForUsers` for bulk notifications
4. **Database indexes:** Notifications table has indexes on `user_id`, `created_at`, and `read`

## Security

1. **RLS Policies:** All tables have RLS policies to prevent unauthorized access
2. **User verification:** API endpoints verify user identity before sending notifications
3. **Email validation:** Resend validates email addresses before sending
4. **Rate limiting:** Consider adding rate limiting to prevent abuse

## Next Steps

1. Integrate notifications into all API endpoints
2. Add notification bell to navbar
3. Test all email templates
4. Monitor email delivery in Resend dashboard
5. Set up error tracking for failed emails
6. Consider adding SMS notifications in future
