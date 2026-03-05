import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cancelPaymentIntent, refundPaymentIntent } from '@/lib/stripe';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * POST /api/v1/requests/[id]/cancel
 * 
 * Customer cancels a request
 * Pre-assignment: cancels PaymentIntent, status='cancelled'
 * Post-assignment: creates dispute, status='disputed'
 * Only customer who created the request can cancel it
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const requestId = params.id;
    const body = await request.json();
    const { reason } = body;

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

    // Verify request can be cancelled
    if (!['open', 'assigned', 'in_progress'].includes(requestData.status)) {
      return NextResponse.json(
        {
          error: 'Заявката не може да бъде отменена в този статус',
          current_status: requestData.status,
        },
        { status: 422 }
      );
    }

    let newStatus = 'cancelled';
    let refundAmount = 0;

    // Handle pre-assignment cancellation
    if (requestData.status === 'open') {
      // Cancel PaymentIntent if exists
      if (requestData.stripe_payment_intent_id) {
        try {
          await cancelPaymentIntent(requestData.stripe_payment_intent_id);
          refundAmount = requestData.price_offer;
        } catch (stripeErr) {
          console.error('Stripe cancel error:', stripeErr);
          return NextResponse.json(
            {
              error: 'payment_cancel_failed',
              message: 'Не можахме да отменим плащането',
            },
            { status: 400 }
          );
        }
      }
    }

    // Handle post-assignment cancellation (create dispute)
    if (requestData.status === 'assigned' || requestData.status === 'in_progress') {
      newStatus = 'disputed';

      // Refund the payment if captured
      if (requestData.stripe_payment_intent_id) {
        try {
          await refundPaymentIntent(requestData.stripe_payment_intent_id);
          refundAmount = requestData.price_offer;
        } catch (stripeErr) {
          console.error('Stripe refund error:', stripeErr);
          // Don't fail - allow dispute to be created even if refund fails
        }
      }
    }

    // Update request status
    const { error: updateError } = await authClient
      .from('requests')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', requestId);

    if (updateError) {
      return NextResponse.json(
        { error: 'Грешка при отмяна на заявката' },
        { status: 500 }
      );
    }

    // If disputed, create payout record with dispute status
    if (newStatus === 'disputed') {
      const { error: payoutError } = await authClient
        .from('payouts')
        .insert({
          request_id: requestId,
          provider_id: requestData.provider_id,
          customer_id: user.id,
          amount_cents: requestData.price_offer,
          status: 'disputed',
          dispute_reason: reason || 'Customer initiated cancellation',
          dispute_notes: reason,
        });

      if (payoutError) {
        console.error('Payout creation error:', payoutError);
        // Don't fail the request if payout creation fails
      }
    }

    // Create audit log entry
    await authClient.from('audit_log').insert({
      entity_type: 'request',
      entity_id: requestId,
      actor_id: user.id,
      action: 'request_cancelled',
      old_value: { status: requestData.status },
      new_value: { status: newStatus, reason },
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
        // await sendRequestCancelledEmail(provider.email, provider.full_name, reason);
      }
    } catch (err) {
      console.error('Error sending notification:', err);
      // Don't fail the request if email fails
    }

    return NextResponse.json(
      {
        success: true,
        message: newStatus === 'cancelled' ? 'Заявката е отменена' : 'Заявката е маркирана като спорна',
        request_id: requestId,
        status: newStatus,
        refund_amount: refundAmount,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Cancel request error:', error);

    return NextResponse.json(
      { error: 'Грешка при отмяна на заявката' },
      { status: 500 }
    );
  }
}
