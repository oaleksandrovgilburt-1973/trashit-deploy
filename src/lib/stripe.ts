import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-11-20',
});

export async function createPaymentIntent(
  amount: number,
  requestId: string,
  customerId?: string
): Promise<Stripe.PaymentIntent> {
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // Convert to cents
    currency: 'bgn', // Bulgarian Lev
    capture_method: 'manual', // Authorize but don't capture
    metadata: {
      request_id: requestId,
      customer_id: customerId || 'unknown',
    },
    description: `Trash removal request #${requestId}`,
  });

  return paymentIntent;
}

export async function capturePaymentIntent(
  paymentIntentId: string
): Promise<Stripe.PaymentIntent> {
  const paymentIntent = await stripe.paymentIntents.capture(paymentIntentId);
  return paymentIntent;
}

export async function cancelPaymentIntent(
  paymentIntentId: string
): Promise<Stripe.PaymentIntent> {
  const paymentIntent = await stripe.paymentIntents.cancel(paymentIntentId);
  return paymentIntent;
}

export async function refundPaymentIntent(
  paymentIntentId: string,
  amount?: number
): Promise<Stripe.Refund> {
  const refund = await stripe.refunds.create({
    payment_intent: paymentIntentId,
    amount: amount ? Math.round(amount * 100) : undefined,
  });
  return refund;
}

export async function createTransfer(
  amount: number,
  destinationAccountId: string,
  requestId: string
): Promise<Stripe.Transfer> {
  const transfer = await stripe.transfers.create({
    amount: Math.round(amount * 100),
    currency: 'bgn',
    destination: destinationAccountId,
    metadata: {
      request_id: requestId,
    },
    description: `Payment for trash removal request #${requestId}`,
  });
  return transfer;
}

export async function getPaymentIntent(
  paymentIntentId: string
): Promise<Stripe.PaymentIntent> {
  return stripe.paymentIntents.retrieve(paymentIntentId);
}

export function verifyWebhookSignature(
  body: string,
  signature: string
): Stripe.Event {
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not set');
  }

  return stripe.webhooks.constructEvent(
    body,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET
  );
}
