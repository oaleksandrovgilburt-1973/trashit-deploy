import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { capturePaymentIntent } from '@/lib/stripe';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * POST /api/v1/requests/[id]/close
 * 
 * Customer confirms job completion and closes the request
 * Triggers Stripe PaymentIntent capture and creates payout record
 * Only customer who created the request can close it
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const requestId = params.id;

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

    // Get request details
    const { data: requestData, error: fetchError } = await authClient
      .from('requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (fetchError || !requestData) {
      return NextResponse.json(
        { error: 'Заявката не е намерена' },
        { status: 404 }
      );
    }

    // Verify customer owns the request
    if (requestData.customer_id !== user.id) {
      return NextResponse.json(
        { error: 'Вие не сте собственик на тази заявка' },
        { status: 403 }
      );
    }

    // Verify request is in completed status
    if (requestData.status !== 'completed') {
      return NextResponse.json(
        {
          error: 'Заявката не е в статус "Завършено"',
          current_status: requestData.status,
        },
        { status: 422 }
      );
    }

    // Capture Stripe payment if exists
    let stripeTransferId = null;
    if (requestData.stripe_payment_intent_id) {
      try {
        const capturedIntent = await capturePaymentIntent(
          requestData.stripe_payment_intent_id
        );

        if (capturedIntent.status !== 'succeeded') {
          return NextResponse.json(
            {
              error: 'payment_capture_failed',
              message: 'Не можахме да обработим плащането',
            },
            { status: 400 }
          );
        }
      } catch (stripeErr) {
        console.error('Stripe capture error:', stripeErr);
        return NextResponse.json(
          {
            error: 'payment_capture_failed',
            message: 'Грешка при обработка на плащането',
          },
          { status: 400 }
        );
      }
    }

    // Update request status to closed
    const { error: updateError } = await authClient
      .from('requests')
      .update({
        status: 'closed',
        closed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', requestId);

    if (updateError) {
      return NextResponse.json(
        { error: 'Грешка при затваряне на заявката' },
        { status: 500 }
      );
    }

    // Create payout record
    const { data: payoutData, error: payoutError } = await authClient
      .from('payouts')
      .insert({
        request_id: requestId,
        provider_id: requestData.provider_id,
        customer_id: user.id,
        amount_cents: requestData.price_offer,
        status: 'pending',
        stripe_transfer_id: stripeTransferId,
      })
      .select()
      .single();

    if (payoutError) {
      console.error('Payout creation error:', payoutError);
      // Don't fail the request if payout creation fails
    }

    // Create audit log entry
    await authClient.from('audit_log').insert({
      entity_type: 'request',
      entity_id: requestId,
      actor_id: user.id,
      action: 'request_closed',
      new_value: { status: 'closed', payment_captured: true },
    });

    // Send notification emails
    try {
      const { data: provider } = await authClient
        .from('profiles')
        .select('*')
        .eq('id', requestData.provider_id)
        .single();

      if (provider?.email) {
        // TODO: Send email via Resend
        // await sendPaymentCapturedEmail(provider.email, provider.full_name, requestData.price_offer / 100);
      }
    } catch (err) {
      console.error('Error sending notification:', err);
      // Don't fail the request if email fails
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Заявката е затворена и плащането е обработено',
        request_id: requestId,
        status: 'closed',
        payout_id: payoutData?.id,
        payment_captured: true,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Close request error:', error);

    return NextResponse.json(
      { error: 'Грешка при затваряне на заявката' },
      { status: 500 }
    );
  }
}
