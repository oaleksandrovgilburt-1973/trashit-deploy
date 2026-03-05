import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia',
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * POST /api/v1/payments/capture
 * 
 * Capture a PaymentIntent when a job is completed
 * Called after provider marks job as completed
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { request_id, payment_intent_id } = body;

    if (!request_id || !payment_intent_id) {
      return NextResponse.json(
        { error: 'Липсват параметри' },
        { status: 400 }
      );
    }

    // Get auth token from header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Неавторизиран достъп' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');

    // Create authenticated client
    const authClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    );

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await authClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Неавторизиран достъп' },
        { status: 401 }
      );
    }

    // Fetch the request to verify ownership
    const { data: requestData, error: fetchError } = await authClient
      .from('requests')
      .select('*')
      .eq('id', request_id)
      .single();

    if (fetchError || !requestData) {
      return NextResponse.json(
        { error: 'Заявката не е намерена' },
        { status: 404 }
      );
    }

    // Verify user is the customer
    if (requestData.customer_id !== user.id) {
      return NextResponse.json(
        { error: 'Нямате достъп до тази заявка' },
        { status: 403 }
      );
    }

    // Verify payment intent matches
    if (requestData.stripe_payment_intent_id !== payment_intent_id) {
      return NextResponse.json(
        { error: 'PaymentIntent не съответства' },
        { status: 400 }
      );
    }

    // Capture the payment intent
    try {
      const capturedIntent = await stripe.paymentIntents.capture(
        payment_intent_id
      );

      if (capturedIntent.status !== 'succeeded') {
        return NextResponse.json(
          {
            error: 'capture_failed',
            message: 'Плащането не можа да бъде заловено',
          },
          { status: 400 }
        );
      }

      // Update request with payment captured info
      const { error: updateError } = await authClient
        .from('requests')
        .update({
          payment_captured: true,
          payment_captured_at: new Date().toISOString(),
        })
        .eq('id', request_id);

      if (updateError) {
        console.error('Update error:', updateError);
        return NextResponse.json(
          { error: 'Грешка при обновяване на заявката' },
          { status: 500 }
        );
      }

      return NextResponse.json(
        {
          success: true,
          message: 'Плащането е успешно заловено',
          charge_id: capturedIntent.charges.data[0]?.id,
          amount: capturedIntent.amount,
          currency: capturedIntent.currency,
        },
        { status: 200 }
      );
    } catch (stripeError) {
      console.error('Stripe error:', stripeError);

      if (stripeError instanceof Stripe.errors.StripeError) {
        return NextResponse.json(
          {
            error: 'stripe_error',
            message: stripeError.message,
          },
          { status: 400 }
        );
      }

      throw stripeError;
    }
  } catch (error) {
    console.error('Capture payment error:', error);

    return NextResponse.json(
      { error: 'Грешка при обработка на плащането' },
      { status: 500 }
    );
  }
}
