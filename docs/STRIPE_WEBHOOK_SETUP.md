# Stripe Webhook Setup Guide

## Overview

This guide explains how to configure Stripe webhooks for production payment processing.

## Webhook Events

TRASHit listens to the following Stripe events:

| Event | Purpose | Handler |
|-------|---------|---------|
| `payment_intent.succeeded` | Payment captured | Create payout record |
| `payment_intent.payment_failed` | Payment failed | Notify customer |
| `charge.refunded` | Refund processed | Update request status |
| `customer.subscription.updated` | Subscription changed | Update provider status |

## Setup Instructions

### Step 1: Create Webhook Endpoint

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Developers** → **Webhooks**
3. Click **Add endpoint**
4. Enter endpoint URL:
   ```
   https://your-domain.com/api/v1/webhooks/stripe
   ```
5. Select events to listen for:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
   - `customer.subscription.updated`

### Step 2: Get Webhook Secret

1. After creating the endpoint, Stripe shows the signing secret
2. Copy the secret (starts with `whsec_`)
3. Add to environment variables:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_your_secret_here
   ```

### Step 3: Deploy Webhook Handler

The webhook handler is already implemented at:
```
src/app/api/v1/webhooks/stripe/route.ts
```

Features:
- Verifies webhook signature
- Processes payment events
- Updates database records
- Sends notifications
- Logs all events

### Step 4: Test Webhook

#### Using Stripe CLI (Local)

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login to your account
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/v1/webhooks/stripe

# Get signing secret from output
# Add to .env.local:
# STRIPE_WEBHOOK_SECRET=whsec_test_...

# In another terminal, trigger test event
stripe trigger payment_intent.succeeded
```

#### Using Stripe Dashboard (Production)

1. Go to **Developers** → **Webhooks**
2. Click on your endpoint
3. Click **Send test webhook**
4. Select event type
5. Click **Send test event**
6. Check response code (should be 200)

### Step 5: Monitor Webhooks

1. Go to **Developers** → **Webhooks**
2. Click on your endpoint
3. View recent deliveries
4. Check status and response

## Webhook Handler Implementation

**File:** `src/app/api/v1/webhooks/stripe/route.ts`

```typescript
export async function POST(request: Request) {
  // 1. Get webhook signature
  const signature = request.headers.get('stripe-signature');
  
  // 2. Verify signature
  const event = stripe.webhooks.constructEvent(
    body,
    signature,
    STRIPE_WEBHOOK_SECRET
  );
  
  // 3. Handle event
  switch (event.type) {
    case 'payment_intent.succeeded':
      // Process payment
      break;
    case 'payment_intent.payment_failed':
      // Handle failure
      break;
    // ... other events
  }
  
  // 4. Return success
  return NextResponse.json({ received: true });
}
```

## Troubleshooting

### Webhook Not Received

1. Check endpoint URL is correct
2. Verify webhook is enabled
3. Check firewall/security rules
4. Review Stripe logs for errors

### Signature Verification Failed

1. Verify `STRIPE_WEBHOOK_SECRET` is correct
2. Check webhook secret hasn't been rotated
3. Ensure you're using live secret in production

### Event Processing Failed

1. Check application logs
2. Review database for errors
3. Check Sentry for exceptions
4. Verify database connection

## Security Best Practices

### 1. Verify Signatures

Always verify webhook signatures:
```typescript
const event = stripe.webhooks.constructEvent(
  body,
  signature,
  secret
);
```

### 2. Use Idempotency

Handle duplicate events:
```typescript
// Store processed event IDs
const processed = await db.webhookEvents.findOne({
  stripeEventId: event.id
});

if (processed) {
  return NextResponse.json({ received: true });
}
```

### 3. Secure Secrets

- Store `STRIPE_WEBHOOK_SECRET` in environment variables
- Never commit secrets to git
- Rotate secrets periodically
- Use different secrets for test/live

### 4. Log Events

Log all webhook events for audit trail:
```typescript
await db.webhookLogs.insert({
  event_id: event.id,
  event_type: event.type,
  status: 'processed',
  timestamp: new Date(),
});
```

## Testing Checklist

- [ ] Webhook endpoint created in Stripe Dashboard
- [ ] Signing secret added to environment variables
- [ ] Webhook handler deployed
- [ ] Test event received and processed
- [ ] Response code is 200
- [ ] Event logged in database
- [ ] Notifications sent correctly
- [ ] Payment records created
- [ ] Refunds processed correctly
- [ ] Errors logged in Sentry

## Production Deployment

1. **Create endpoint** in Stripe Dashboard
2. **Add secret** to Vercel environment variables
3. **Deploy** application
4. **Test** with Stripe Dashboard
5. **Monitor** webhook deliveries
6. **Set up alerts** for failures

## Monitoring

### Stripe Dashboard

- **Developers** → **Webhooks**
- View recent deliveries
- Check response codes
- Review error messages

### Application Logs

```sql
-- View webhook logs
SELECT * FROM webhook_logs
WHERE event_type LIKE 'payment_intent%'
ORDER BY created_at DESC;

-- View failed webhooks
SELECT * FROM webhook_logs
WHERE status = 'failed'
ORDER BY created_at DESC;
```

### Sentry

- Monitor webhook errors
- Track failed payments
- Alert on anomalies

## References

- [Stripe Webhooks Documentation](https://stripe.com/docs/webhooks)
- [Webhook Security](https://stripe.com/docs/webhooks/signatures)
- [Testing Webhooks](https://stripe.com/docs/webhooks/test)
- [Stripe CLI](https://stripe.com/docs/stripe-cli)
