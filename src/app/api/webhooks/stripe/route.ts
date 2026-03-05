import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Липсва Stripe подпис' },
      { status: 400 }
    );
  }

  try {
    // Get raw body for signature verification
    const body = await request.text();

    // Verify webhook signature
    const event = verifyWebhookSignature(body, signature);

    // Log the event
    console.log(`[Stripe Webhook] Event type: ${event.type}`);

    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.canceled':
        await handlePaymentIntentCanceled(event.data.object as Stripe.PaymentIntent);
        break;

      case 'charge.captured':
        await handleChargeCaptured(event.data.object as Stripe.Charge);
        break;

      case 'charge.refunded':
        await handleChargeRefunded(event.data.object as Stripe.Charge);
        break;

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('[Stripe Webhook] Error:', error);

    if (error instanceof Error && error.message.includes('signature')) {
      return NextResponse.json(
        { error: 'Невалиден Stripe подпис' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Грешка при обработка на webhook' },
      { status: 500 }
    );
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log(`[Stripe] Payment intent succeeded: ${paymentIntent.id}`);
  // Could update request status or send notification here
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log(`[Stripe] Payment intent failed: ${paymentIntent.id}`);
  console.log(`[Stripe] Last error: ${paymentIntent.last_payment_error?.message}`);
  // Could update request status or send notification here
}

async function handlePaymentIntentCanceled(paymentIntent: Stripe.PaymentIntent) {
  console.log(`[Stripe] Payment intent canceled: ${paymentIntent.id}`);
  // Could update request status or send notification here
}

async function handleChargeCaptured(charge: Stripe.Charge) {
  console.log(`[Stripe] Charge captured: ${charge.id}`);
  console.log(`[Stripe] Amount: ${charge.amount / 100} ${charge.currency.toUpperCase()}`);
  // Could update request status to mark payment as captured
}

async function handleChargeRefunded(charge: Stripe.Charge) {
  console.log(`[Stripe] Charge refunded: ${charge.id}`);
  console.log(`[Stripe] Amount refunded: ${charge.amount_refunded / 100} ${charge.currency.toUpperCase()}`);
  // Could update request status or send notification here
}
