# Email System Setup Guide

Quick start guide for setting up the email notification system in TRASHit.

## Prerequisites

- Node.js 18+
- npm or pnpm
- Supabase project
- Resend account (free at https://resend.com)

## Step 1: Install Dependencies

```bash
cd /home/ubuntu/trashit
npm install resend @react-email/components @react-email/render
```

Or with pnpm:

```bash
pnpm add resend @react-email/components @react-email/render
```

## Step 2: Get Resend API Key

1. Go to https://resend.com
2. Sign up for a free account
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key (format: `re_xxxxxxxxxxxxx`)

## Step 3: Configure Environment Variables

Create or update `.env.local`:

```env
# Resend API Key
RESEND_API_KEY=re_xxxxxxxxxxxxx

# Application URL (for email links)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase (already configured)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxx
SUPABASE_SERVICE_ROLE_KEY=xxxxx
```

## Step 4: Run Database Migrations

1. Open Supabase Dashboard
2. Go to SQL Editor
3. Create a new query
4. Copy and paste the contents of `/supabase/migrations/013_notifications.sql`
5. Click "Run"

The migration creates:
- `notifications` table for in-app notifications
- `email_log` table for tracking sent emails
- RLS policies for security

## Step 5: Verify Installation

### Option A: Test Email Endpoint

```bash
curl -X POST http://localhost:3000/api/v1/test/send-email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@example.com",
    "type": "request_created"
  }'
```

Expected response:

```json
{
  "success": true,
  "message": "Test email sent to your-email@example.com",
  "emailId": "xxxxx"
}
```

### Option B: React Email Preview

```bash
npx react-email preview
```

Opens preview server where you can see all email templates.

## Step 6: Add Notification Bell to Navbar

Update your navbar component to include the notification bell:

```typescript
import { NotificationBell } from '@/components/NotificationBell';

export function Navbar() {
  return (
    <nav className="flex items-center justify-between">
      {/* ... existing navbar content ... */}
      <NotificationBell />
    </nav>
  );
}
```

## Step 7: Integrate Notifications into Endpoints

For each major event, add the appropriate notification:

```typescript
// Example: When request is created
import { notifyRequestCreated } from '@/lib/notifications/sender';

// After creating request
await notifyRequestCreated(customerId, requestId, {
  description: 'Отвоз на боклук',
  address: 'ул. Васил Левски 42',
  region: 'Лозенец',
  price: 50,
});
```

See `INTEGRATION_GUIDE.md` for detailed integration instructions.

## Step 8: Test in Development

1. Start the dev server:

```bash
npm run dev
```

2. Create a test account and make a request
3. Check email inbox for notification
4. Check in-app notifications bell
5. View full notifications at `/dashboard/notifications`

## Troubleshooting

### Email not received

**Check 1: Verify API Key**
```bash
# Test Resend API key
curl -X GET https://api.resend.com/emails \
  -H "Authorization: Bearer re_xxxxxxxxxxxxx"
```

**Check 2: Check Email Logs**
```sql
SELECT * FROM email_log
ORDER BY created_at DESC
LIMIT 10;
```

**Check 3: Check Resend Dashboard**
- Go to https://resend.com/emails
- Look for failed emails
- Check error messages

### In-app notifications not appearing

**Check 1: Verify notifications table exists**
```sql
SELECT * FROM notifications LIMIT 1;
```

**Check 2: Check RLS policies**
```sql
SELECT * FROM pg_policies 
WHERE tablename = 'notifications';
```

**Check 3: Check browser console**
- Open DevTools
- Check Network tab for `/api/v1/notifications` requests
- Check Console for errors

### Templates not rendering

**Check 1: Verify React Email installation**
```bash
npm list react-email
```

**Check 2: Check template imports**
All templates should be in `/src/emails/` directory

**Check 3: Test React Email preview**
```bash
npx react-email preview
```

## Email Types Reference

| Type | Recipients | When |
|------|-----------|------|
| `request_created` | Customer | Request created |
| `request_accepted` | Customer | Provider accepts |
| `job_started` | Customer | Provider starts work |
| `job_completed` | Customer | Provider completes job |
| `job_closed` | Provider | Payment captured |
| `provider_approved` | Provider | Admin approves profile |
| `new_message` | Recipient | New chat message |
| `dispute_opened` | Provider, Admin | Dispute opened |

## API Endpoints

### Fetch Notifications
```
GET /api/v1/notifications?limit=20&offset=0
```

### Mark as Read
```
PUT /api/v1/notifications
Body: { "id": "notification-id", "read": true }
```

### Delete Notification
```
DELETE /api/v1/notifications
Body: { "id": "notification-id" }
```

### Send Test Email
```
POST /api/v1/test/send-email
Body: { "email": "test@example.com", "type": "request_created" }
```

## Next Steps

1. ✅ Install dependencies
2. ✅ Set up Resend account
3. ✅ Configure environment variables
4. ✅ Run database migrations
5. ✅ Verify installation with test endpoint
6. ✅ Add notification bell to navbar
7. ✅ Integrate notifications into endpoints
8. ✅ Test in development
9. ⬜ Deploy to production
10. ⬜ Monitor email delivery

## Production Checklist

- [ ] Use production Resend API key
- [ ] Set `NEXT_PUBLIC_APP_URL` to production domain
- [ ] Enable email verification in Resend
- [ ] Set up email domain (optional but recommended)
- [ ] Monitor email delivery in Resend dashboard
- [ ] Set up error tracking for failed emails
- [ ] Configure email rate limits
- [ ] Test all email templates in production
- [ ] Set up backup email service (optional)

## Support

For issues:

1. Check the troubleshooting section above
2. Review email logs in database
3. Check Resend dashboard
4. Review `/docs/EMAIL_SYSTEM.md` for detailed documentation
5. Check `/docs/INTEGRATION_GUIDE.md` for integration examples

## Resources

- [Resend Documentation](https://resend.com/docs)
- [React Email Documentation](https://react.email)
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
